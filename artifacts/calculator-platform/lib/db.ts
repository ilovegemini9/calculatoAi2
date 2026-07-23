import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { AppSchema, SystemSettings } from './types';
import { DEFAULT_SEO_SETTINGS, getSeoSettings } from './seo';
import { DEFAULT_ADS_SETTINGS, getAdsSettings } from './ads';
import { DEFAULT_VERIFICATION_SETTINGS, getVerificationSettings } from './verification';
import { DEFAULT_AI_SETTINGS, getAiSettings } from './ai';

// On read-only hosts (e.g. Vercel serverless), fall back to /tmp which is always writable.
// Note: /tmp is ephemeral on serverless — data resets between cold starts.
// Use ADMIN_PASSWORD env var for persistent admin access on Vercel.
const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'data', 'db.json')
  : path.join(process.cwd(), 'data', 'db.json');

const DEFAULT_SETTINGS: SystemSettings = {
  openrouterApiKey: '',
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

export function getDb(): AppSchema {
  ensureDirectoryExistence();
  if (!fs.existsSync(DB_PATH)) {
    // Generate default admin with credentials user: admin / pass: 111111
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('111111', salt);
    
    const initialDb: AppSchema = {
      ...DEFAULT_DB,
      adminUsers: [
        {
          id: 'admin-id',
          username: process.env.ADMIN_USERNAME || 'admin',
          passwordHash: passwordHash,
          createdAt: new Date().toISOString(),
        }
      ],
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
    db.analytics = db.analytics || [];
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
    db.logs = db.logs || [];
    db.backups = db.backups || [];
    
    // Ensure admin user exists if table is empty
    if (db.adminUsers.length === 0) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync('111111', salt);
      db.adminUsers.push({
        id: 'admin-id',
        username: process.env.ADMIN_USERNAME || 'admin',
        passwordHash: passwordHash,
        createdAt: new Date().toISOString(),
      });
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    }
    
    return db;
  } catch (err) {
    console.error('Error reading JSON DB, fallback to default:', err);
    return DEFAULT_DB;
  }
}

export function saveDb(db: AppSchema) {
  ensureDirectoryExistence();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}
