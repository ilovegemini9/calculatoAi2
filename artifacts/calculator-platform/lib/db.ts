import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { AppSchema, SystemSettings } from './types';

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
    db.settings = { ...DEFAULT_SETTINGS, ...db.settings };
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
