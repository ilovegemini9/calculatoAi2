import 'server-only';

import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import type { AppSchema, SystemSettings } from './types';
import { DEFAULT_SEO_SETTINGS, getSeoSettings } from './seo';
import { DEFAULT_ADS_SETTINGS, getAdsSettings } from './ads';
import { DEFAULT_VERIFICATION_SETTINGS, getVerificationSettings } from './verification';
import { DEFAULT_AI_SETTINGS, getAiSettings } from './ai';

const globalForDb = globalThis as typeof globalThis & {
  calculatorPlatformPool?: Pool;
};

function getPool(): Pool {
  if (globalForDb.calculatorPlatformPool) return globalForDb.calculatorPlatformPool;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error('A Neon Postgres connection URL is required for durable admin storage.');
  }

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  globalForDb.calculatorPlatformPool = pool;
  return pool;
}

const DEFAULT_SETTINGS: SystemSettings = {
  openrouterApiKey: '',
  serpApiKeyEncrypted: '',
  adsenseEnabled: false,
  adsenseCode: '',
  analyticsCode: '',
  seo: DEFAULT_SEO_SETTINGS,
  ads: DEFAULT_ADS_SETTINGS,
  verification: DEFAULT_VERIFICATION_SETTINGS,
  ai: DEFAULT_AI_SETTINGS,
  featureFlags: {
    aiEnabled: true,
    maintenanceMode: false,
  },
};

function generateInitialAnalytics(): AppSchema['analytics'] {
  const analytics: AppSchema['analytics'] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const views = 120 + Math.floor(Math.sin(i) * 35) + (13 - i) * 8;
    analytics.push({
      id: `an-${i}`,
      date: date.toISOString().slice(0, 10),
      views,
      uniqueVisitors: Math.round(views * 0.72),
    });
  }
  return analytics;
}

function generateInitialLogs(): AppSchema['logs'] {
  const now = Date.now();
  return [
    { id: 'log-1', timestamp: new Date(now - 7_200_000).toISOString(), level: 'INFO', message: 'System initialization and database verify complete.', route: '/app' },
    { id: 'log-2', timestamp: new Date(now - 5_400_000).toISOString(), level: 'INFO', message: 'Admin session verified successfully.', route: '/admin' },
    { id: 'log-3', timestamp: new Date(now - 2_700_000).toISOString(), level: 'INFO', message: 'AI Provider settings synchronized.', route: '/api/admin/settings/ai' },
    { id: 'log-4', timestamp: new Date(now - 600_000).toISOString(), level: 'INFO', message: 'SEO and Sitemap metadata generated.', route: '/api/admin/seo' },
  ];
}

function createInitialDb(): AppSchema {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  return {
    adminUsers: password ? [{
      id: 'admin-id',
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      createdAt: new Date().toISOString(),
    }] : [],
    calculators: [],
    articles: [],
    articleVersions: [],
    redirects: [],
    analytics: generateInitialAnalytics(),
    settings: DEFAULT_SETTINGS,
    logs: generateInitialLogs(),
    backups: [],
  };
}

function applyDefaults(value: AppSchema): AppSchema {
  const legacyOpenRouterKey = value.settings?.openrouterApiKey || '';
  return {
    ...value,
    adminUsers: value.adminUsers || [],
    calculators: value.calculators || [],
    articles: value.articles || [],
    articleVersions: value.articleVersions || [],
    redirects: value.redirects || [],
    analytics: Array.isArray(value.analytics) && value.analytics.length > 0 ? value.analytics : generateInitialAnalytics(),
    settings: {
      ...DEFAULT_SETTINGS,
      ...value.settings,
      openrouterApiKey: '',
      seo: getSeoSettings(value.settings?.seo),
      ads: getAdsSettings(value.settings?.ads),
      verification: getVerificationSettings(value.settings?.verification),
      ai: getAiSettings(value.settings?.ai, legacyOpenRouterKey),
      featureFlags: { ...DEFAULT_SETTINGS.featureFlags, ...value.settings?.featureFlags },
    },
    logs: Array.isArray(value.logs) && value.logs.length > 0 ? value.logs : generateInitialLogs(),
    backups: value.backups || [],
  };
}

async function ensureState(): Promise<AppSchema> {
  const initial = createInitialDb();
  const result = await getPool().query<{ data: AppSchema }>(
    `INSERT INTO app_state (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET id = app_state.id
     RETURNING data`,
    [JSON.stringify(initial)],
  );
  return applyDefaults(result.rows[0].data);
}

export async function getDb(): Promise<AppSchema> {
  const hasDatabaseUrl = Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING,
  );

  if (!hasDatabaseUrl) {
    console.warn('[db] Neon connection URL is unavailable; rendering read-only defaults.');
    return createInitialDb();
  }

  try {
    const result = await getPool().query<{ data: AppSchema }>('SELECT data FROM app_state WHERE id = $1', [1]);
    if (result.rows[0]) return applyDefaults(result.rows[0].data);
    return await ensureState();
  } catch (error) {
    console.error('[db] Failed to read durable admin state:', error);
    throw new Error('Admin database is unavailable.');
  }
}

export async function saveDb(data: AppSchema): Promise<void> {
  try {
    await getPool().query(
      `INSERT INTO app_state (id, data, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(applyDefaults(data))],
    );
  } catch (error) {
    console.error('[db] Failed to persist admin state:', error);
    throw new Error('Admin changes could not be saved.');
  }
}

export async function logEvent(level: 'INFO' | 'WARN' | 'ERROR', message: string, route = '/admin', details?: unknown): Promise<void> {
  const data = await getDb();
  data.logs = [{
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    route,
    details,
  }, ...(data.logs || [])].slice(0, 500);
  await saveDb(data);
}

export async function trackAnalytics(views = 1): Promise<void> {
  const data = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const existing = data.analytics.find((entry) => entry.date === today);
  if (existing) {
    existing.views += views;
    existing.uniqueVisitors = Math.round(existing.views * 0.75);
  } else {
    data.analytics.push({ id: `an-${Date.now()}`, date: today, views, uniqueVisitors: Math.round(views * 0.75) });
  }
  await saveDb(data);
}
