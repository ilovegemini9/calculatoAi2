import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db as pgDb, appStateTable, appStateBackupTable } from '@workspace/db';
import {
  AdminUser,
  Calculator,
  Article,
  ArticleVersion,
  Redirect,
  Analytic,
  SystemSettings,
  AppSchema,
} from './types.js';

export type { Calculator, Article, Redirect, SystemSettings };

// Primary storage is Postgres (via @workspace/db / DATABASE_URL) so data
// persists identically whether this server runs on Replit or as a Vercel
// serverless function (which has no durable local filesystem). The local
// .data/ JSON files are kept only as an in-process fallback/log store.
const DB_DIR = path.resolve(process.cwd(), '.data');
const LOGS_FILE = path.join(DB_DIR, 'logs.json');
const APP_STATE_ROW_ID = 1;

const DEFAULT_SETTINGS: SystemSettings = {
  // Accept OPENAI_API_KEY too — some OpenRouter keys (sk-or-...) get saved under
  // that name by mistake since OpenRouter exposes an OpenAI-compatible API.
  openrouterApiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '',
  adsenseEnabled: false,
  adsenseCode: '',
  analyticsCode: '',
  featureFlags: {
    aiEnabled: true,
    maintenanceMode: false,
  },
};

const DEFAULT_CALCULATORS: Calculator[] = [
  {
    id: 'mortgage',
    slug: 'mortgage-calculator',
    name: 'Mortgage Calculator',
    category: 'financial',
    status: 'active',
    metadata: {
      title: 'Mortgage Calculator - Real-Time Amortization Schedule',
      description:
        'Calculate your monthly mortgage payments with our advanced Mortgage Calculator.',
      keywords: ['mortgage calculator', 'mortgage payment', 'home loan', 'amortization schedule'],
    },
    settings: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bmi',
    slug: 'bmi-calculator',
    name: 'BMI Calculator',
    category: 'fitness',
    status: 'active',
    metadata: {
      title: 'BMI Calculator - Metric & Imperial Body Mass Index',
      description:
        'Find your Body Mass Index (BMI) instantly. Support for both metric and imperial systems.',
      keywords: ['bmi calculator', 'body mass index', 'weight calculator', 'fitness metrics'],
    },
    settings: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'percentage',
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    category: 'math',
    status: 'active',
    metadata: {
      title: 'Percentage Calculator - Fast Multi-Case Calculations',
      description: 'Calculate percentages instantly with multiple formula options.',
      keywords: ['percentage calculator', 'calculate percentage', 'percent change', 'math tools'],
    },
    settings: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'loan',
    slug: 'loan-calculator',
    name: 'Loan Calculator',
    category: 'financial',
    status: 'active',
    metadata: {
      title: 'Loan Calculator - Complete Monthly Payments & Interest Tracker',
      description:
        'Estimate monthly loan payments and check overall interest charges.',
      keywords: ['loan calculator', 'loan payment', 'personal loan', 'interest rate'],
    },
    settings: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'age',
    slug: 'age-calculator',
    name: 'Age Calculator',
    category: 'more',
    status: 'active',
    metadata: {
      title: 'Age Calculator - Precise Years, Months & Days Tracker',
      description:
        'Determine your exact age in years, months, and days from your birth date.',
      keywords: ['age calculator', 'calculate age', 'birthday countdown', 'days old'],
    },
    settings: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tip',
    slug: 'tip-calculator',
    name: 'Tip Calculator',
    category: 'more',
    status: 'active',
    metadata: {
      title: 'Tip Calculator - Quick Split & Bill Share Calculator',
      description: 'Calculate tips and split bills quickly.',
      keywords: ['tip calculator', 'tip amount', 'bill split', 'restaurant tip'],
    },
    settings: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'calorie',
    slug: 'calorie-calculator',
    name: 'Calorie Calculator',
    category: 'fitness',
    status: 'active',
    metadata: {
      title: 'Calorie Calculator - Daily Calorie Intake & TDEE',
      description: 'Calculate your daily calorie needs based on age, weight, height and activity.',
      keywords: ['calorie calculator', 'tdee', 'daily calories', 'weight loss'],
    },
    settings: {},
    createdAt: new Date().toISOString(),
  },
  {
    id: 'gpa',
    slug: 'gpa-calculator',
    name: 'GPA Calculator',
    category: 'more',
    status: 'active',
    metadata: {
      title: 'GPA Calculator - Weighted & Unweighted Grade Point Average',
      description: 'Calculate your weighted and unweighted GPA with our free GPA calculator.',
      keywords: ['gpa calculator', 'grade point average', 'weighted gpa', 'unweighted gpa'],
    },
    settings: {},
    createdAt: new Date().toISOString(),
  },
];

function generateRandomPassword(length = 20): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let pwd = '';
  // Use Math.random — no Node crypto needed, only used during DB init
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

function getDefaultDB(): AppSchema {
  // Default password is '123456' unless ADMIN_PASSWORD env var is set.
  // The login route also accepts the plaintext fallback for serverless environments.
  const initialPassword = process.env.ADMIN_PASSWORD || '123456';
  const adminPasswordHash = bcrypt.hashSync(initialPassword, 10);

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  ADMIN CREDENTIALS                               ║');
  console.log(`║  Username : admin                                 ║`);
  console.log(`║  Password : ${initialPassword.padEnd(37)}║`);
  console.log('║  Set ADMIN_PASSWORD env var to override.          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  return {
    adminUsers: [
      {
        id: 'admin_1',
        username: 'admin',
        passwordHash: adminPasswordHash,
        createdAt: new Date().toISOString(),
      },
    ],
    calculators: DEFAULT_CALCULATORS,
    articles: [],
    articleVersions: [],
    redirects: [],
    analytics: [],
    settings: DEFAULT_SETTINGS,
  };
}

function applySettingsDefaults(parsed: AppSchema): AppSchema {
  parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
  // An empty stored key means "never configured" — don't let it shadow an
  // env-provided key (e.g. OPENROUTER_API_KEY / OPENAI_API_KEY added later).
  if (!parsed.settings.openrouterApiKey) {
    parsed.settings.openrouterApiKey = DEFAULT_SETTINGS.openrouterApiKey;
  }
  parsed.settings.featureFlags = {
    ...DEFAULT_SETTINGS.featureFlags,
    ...parsed.settings.featureFlags,
  };
  return parsed;
}

// In-memory cache — always the source of truth for synchronous reads
// (getDB/saveDB). Backed by Postgres so it survives restarts/cold starts
// identically on Replit and on Vercel serverless functions.
let _memoryDB: AppSchema | null = null;
let _readyPromise: Promise<AppSchema> | null = null;

// Serializes writes to Postgres so overlapping saveDB() calls don't race.
let _writeQueue: Promise<void> = Promise.resolve();

// Awaited once per process before the server (or a serverless invocation)
// starts handling requests — see the readiness middleware in app.ts.
export function whenReady(): Promise<AppSchema> {
  if (!_readyPromise) {
    _readyPromise = initDB();
  }
  return _readyPromise;
}

export async function initDB(): Promise<AppSchema> {
  try {
    const rows = await pgDb.select().from(appStateTable).where(eq(appStateTable.id, APP_STATE_ROW_ID));
    if (rows.length > 0) {
      const parsed = applySettingsDefaults(rows[0].data as AppSchema);
      _memoryDB = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('[db] Failed to read app_state from Postgres — starting from defaults.', err);
  }

  // No row found (first boot) — create a fresh default DB and persist it.
  const defaultDB = getDefaultDB();
  _memoryDB = defaultDB; // always cache in memory before any DB write

  try {
    await pgDb
      .insert(appStateTable)
      .values({ id: APP_STATE_ROW_ID, data: defaultDB })
      .onConflictDoNothing();
  } catch (err) {
    console.error('[db] Failed to persist initial app_state to Postgres — running in-memory only.', err);
  }

  return defaultDB;
}

export function getDB(): AppSchema {
  if (_memoryDB) return _memoryDB;
  // Should not normally happen — whenReady() is awaited before requests are
  // served — but fall back to sane defaults rather than crashing.
  _memoryDB = getDefaultDB();
  return _memoryDB;
}

export function saveDB(data: AppSchema): void {
  _memoryDB = data; // always update memory cache first, synchronously

  _writeQueue = _writeQueue
    .then(async () => {
      await pgDb
        .insert(appStateTable)
        .values({ id: APP_STATE_ROW_ID, data, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: appStateTable.id,
          set: { data, updatedAt: new Date() },
        });
    })
    .catch((err) => {
      console.error('[db] Failed to persist app_state to Postgres — change kept in memory only.', err);
    });
}

export async function backupDB(): Promise<void> {
  const data = getDB();
  await pgDb.insert(appStateBackupTable).values({ data });
  logEvent('backup', `Database backup created (${new Date().toISOString()})`);
}

export interface ErrorLog {
  timestamp: string;
  type: string;
  message: string;
}

// Logs are best-effort and low-value enough to keep file-based, with an
// in-memory fallback for read-only filesystems (e.g. Vercel serverless).
let _memoryLogs: ErrorLog[] | null = null;

export function logEvent(type: string, message: string): void {
  let logs: ErrorLog[] = getLogs();
  logs.unshift({ timestamp: new Date().toISOString(), type, message });
  if (logs.length > 500) logs = logs.slice(0, 500);
  _memoryLogs = logs;
  try {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem — logs kept in memory for the process lifetime only
  }
}

export function getLogs(): ErrorLog[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    }
  } catch {
    // fall through to memory fallback
  }
  return _memoryLogs ?? [];
}
