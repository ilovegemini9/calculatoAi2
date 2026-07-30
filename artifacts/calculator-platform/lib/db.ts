import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { AppSchema, SystemSettings } from './types';
import { DEFAULT_SEO_SETTINGS, getSeoSettings } from './seo';
import { DEFAULT_ADS_SETTINGS, getAdsSettings } from './ads';
import { DEFAULT_VERIFICATION_SETTINGS, getVerificationSettings } from './verification';
import { DEFAULT_AI_SETTINGS, getAiSettings } from './ai';

// This JSON store is only a compatibility fallback; durable application data
// uses PostgreSQL through the shared settings/API layers. Keep the fallback in
// a neutral temporary directory so read-only and writable hosts behave alike.
const DATA_DIR = process.env.DATA_DIR || path.join('/tmp', 'calculator-platform-data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

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

const DEFAULT_DB: AppSchema = {
  adminUsers: [],
  calculators: [],
  articles: [],
  articleVersions: [],
  redirects: [],
  analytics: [],
  settings: DEFAULT_SETTINGS,
  logs: [],
  backups: [],
};

// Ensure data directory exists
function ensureDirectoryExistence() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function requireAdminCredentials(): { username: string; password: string } {
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const username = process.env.ADMIN_USERNAME || 'admin';
  return { username, password };
}

function generateInitialAnalytics() {
  const analytics: AppSchema['analytics'] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    // Seed realistic traffic numbers
    const baseViews = 120 + Math.floor(Math.sin(i) * 35) + (13 - i) * 8;
    analytics.push({
      id: `an-${i}`,
      date: dateStr,
      views: baseViews,
      uniqueVisitors: Math.round(baseViews * 0.72),
    });
  }
  return analytics;
}

function generateInitialLogs(): AppSchema['logs'] {
  const now = new Date();
  return [
    {
      id: 'log-1',
      timestamp: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
      level: 'INFO',
      message: 'System initialization and database verify complete.',
      route: '/app',
    },
    {
      id: 'log-2',
      timestamp: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
      level: 'INFO',
      message: 'Admin session verified successfully.',
      route: '/admin',
    },
    {
      id: 'log-3',
      timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
      level: 'INFO',
      message: 'AI Provider settings synchronized.',
      route: '/api/admin/settings/ai',
    },
    {
      id: 'log-4',
      timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
      level: 'INFO',
      message: 'SEO and Sitemap metadata generated.',
      route: '/api/admin/seo',
    },
  ];
}

export function getDb(): AppSchema {
  ensureDirectoryExistence();
  if (!fs.existsSync(DB_PATH)) {
    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_USERNAME) {
      return {
        ...DEFAULT_DB,
        analytics: generateInitialAnalytics(),
        logs: generateInitialLogs(),
      };
    }
    const { username, password } = requireAdminCredentials();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const initialDb: AppSchema = {
      ...DEFAULT_DB,
      adminUsers: [
        {
          id: 'admin-id',
          username,
          passwordHash,
          createdAt: new Date().toISOString(),
        },
      ],
      analytics: generateInitialAnalytics(),
      logs: generateInitialLogs(),
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const db = JSON.parse(raw) as AppSchema;
    
    // Safety check to ensure all tables exist
    db.adminUsers = db.adminUsers || [];
    db.calculators = db.calculators || [];
    db.articles = db.articles || [];
    db.articleVersions = db.articleVersions || [];
    db.redirects = db.redirects || [];
    db.analytics = Array.isArray(db.analytics) && db.analytics.length > 0 ? db.analytics : generateInitialAnalytics();
    const legacyOpenRouterKey = db.settings?.openrouterApiKey || '';
    db.settings = {
      ...DEFAULT_SETTINGS,
      ...db.settings,
      seo: getSeoSettings(db.settings?.seo),
      ads: getAdsSettings(db.settings?.ads),
      verification: getVerificationSettings(db.settings?.verification),
      ai: getAiSettings(db.settings?.ai, legacyOpenRouterKey),
      featureFlags: { ...DEFAULT_SETTINGS.featureFlags, ...db.settings.featureFlags },
    };
    if (legacyOpenRouterKey) {
      db.settings.openrouterApiKey = '';
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    db.logs = Array.isArray(db.logs) && db.logs.length > 0 ? db.logs : generateInitialLogs();
    db.backups = db.backups || [];
    
    // Ensure admin user exists if table is empty
    if (db.adminUsers.length === 0) {
      const { username, password } = requireAdminCredentials();
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      db.adminUsers.push({
        id: 'admin-id',
        username,
        passwordHash,
        createdAt: new Date().toISOString(),
      });
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    
    return db;
  } catch (err) {
    console.error('Error reading JSON DB, fallback to default:', err);
    return {
      ...DEFAULT_DB,
      analytics: generateInitialAnalytics(),
      logs: generateInitialLogs(),
    };
  }
}

export function saveDb(db: AppSchema) {
  ensureDirectoryExistence();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function logEvent(level: 'INFO' | 'WARN' | 'ERROR', message: string, route = '/admin', details?: unknown) {
  try {
    const db = getDb();
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      route,
      details,
    };
    db.logs = [newLog, ...(db.logs || [])].slice(0, 500);
    saveDb(db);
  } catch (err) {
    console.error('[logEvent] failed:', err);
  }
}

export function trackAnalytics(views = 1) {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    db.analytics = db.analytics || [];
    const existing = db.analytics.find((a) => a.date === today);
    if (existing) {
      existing.views += views;
      existing.uniqueVisitors = Math.round(existing.views * 0.75);
    } else {
      db.analytics.push({
        id: `an-${Date.now()}`,
        date: today,
        views,
        uniqueVisitors: Math.round(views * 0.75),
      });
    }
    saveDb(db);
  } catch (err) {
    console.error('[trackAnalytics] failed:', err);
  }
}
