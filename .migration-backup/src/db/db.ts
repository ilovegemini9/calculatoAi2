import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import {
  AdminUser,
  Calculator,
  Article,
  ArticleVersion,
  Redirect,
  Analytic,
  SystemSettings,
  AppSchema
} from '../types';

export type { Calculator, Article, Redirect, SystemSettings };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../.data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const LOGS_FILE = path.join(DB_DIR, 'logs.json');



const DEFAULT_SETTINGS: SystemSettings = {
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
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
      description: 'Calculate your monthly mortgage payments with our advanced Mortgage Calculator. View real-time mobile-friendly amortization charts, custom down payments, and rate structures.',
      keywords: ['mortgage calculator', 'mortgage payment', 'home loan', 'amortization schedule']
    },
    settings: {},
    createdAt: new Date().toISOString()
  },
  {
    id: 'bmi',
    slug: 'bmi-calculator',
    name: 'BMI Calculator',
    category: 'fitness',
    status: 'active',
    metadata: {
      title: 'BMI Calculator - Metric & Imperial Body Mass Index',
      description: 'Find your Body Mass Index (BMI) instantly. Support for both metric (kg/cm) and imperial (lbs/inches) systems with healthy weight ranges and health recommendations.',
      keywords: ['bmi calculator', 'body mass index', 'weight calculator', 'fitness metrics']
    },
    settings: {},
    createdAt: new Date().toISOString()
  },
  {
    id: 'percentage',
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    category: 'math',
    status: 'active',
    metadata: {
      title: 'Percentage Calculator - Fast Multi-Case Calculations',
      description: 'Calculate percentages instantly with multiple formula options. Perfect for calculating percentage increases, decreases, fractions, and proportions.',
      keywords: ['percentage calculator', 'calculate percentage', 'percent change', 'math tools']
    },
    settings: {},
    createdAt: new Date().toISOString()
  },
  {
    id: 'loan',
    slug: 'loan-calculator',
    name: 'Loan Calculator',
    category: 'financial',
    status: 'active',
    metadata: {
      title: 'Loan Calculator - Complete Monthly Payments & Interest Tracker',
      description: 'Estimate monthly loan payments and check overall interest charges. View custom amortization charts suitable for all personal and business loans.',
      keywords: ['loan calculator', 'loan payment', 'personal loan', 'interest rate']
    },
    settings: {},
    createdAt: new Date().toISOString()
  },
  {
    id: 'age',
    slug: 'age-calculator',
    name: 'Age Calculator',
    category: 'more',
    status: 'active',
    metadata: {
      title: 'Age Calculator - Precise Years, Months & Days Tracker',
      description: 'Determine your exact age in years, months, and days from your birth date. Includes countdowns to your next birthday and fun time metrics.',
      keywords: ['age calculator', 'calculate age', 'birthday countdown', 'days old']
    },
    settings: {},
    createdAt: new Date().toISOString()
  },
  {
    id: 'tip',
    slug: 'tip-calculator',
    name: 'Tip Calculator',
    category: 'more',
    status: 'active',
    metadata: {
      title: 'Tip Calculator - Quick Split & Bill Share Calculator',
      description: 'Split restaurant bills and calculate tip percentages instantly. Ideal for group dining, showing tip and total amounts per person with ease.',
      keywords: ['tip calculator', 'split bill', 'gratuity calculator', 'tip share']
    },
    settings: {},
    createdAt: new Date().toISOString()
  },
  {
    id: 'calorie',
    slug: 'calorie-calculator',
    name: 'Calorie Calculator',
    category: 'fitness',
    status: 'active',
    metadata: {
      title: 'Calorie Calculator - Daily Caloric Needs & BMR',
      description: 'Estimate your daily calorie requirements based on your height, weight, age, and activity level using the Mifflin-St Jeor formula for custom fitness goals.',
      keywords: ['calorie calculator', 'daily calories', 'BMR', 'weight loss calories']
    },
    settings: {},
    createdAt: new Date().toISOString()
  },
  {
    id: 'gpa',
    slug: 'gpa-calculator',
    name: 'GPA Calculator',
    category: 'more',
    status: 'active',
    metadata: {
      title: 'GPA Calculator - High School & College GPA Planner',
      description: 'Plan your semester grades and calculate weighted/unweighted cumulative GPA with our flexible course-by-course letter grade calculator.',
      keywords: ['gpa calculator', 'calculate gpa', 'college gpa', 'weighted grade calculator']
    },
    settings: {},
    createdAt: new Date().toISOString()
  }
];

export function initDB(): AppSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('123456', salt);

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content) as AppSchema;
      // Ensure basic structure exists
      if (!data.adminUsers) data.adminUsers = [];
      if (!data.calculators) data.calculators = DEFAULT_CALCULATORS;
      if (!data.articles) data.articles = [];
      if (!data.articleVersions) data.articleVersions = [];
      if (!data.redirects) data.redirects = [];
      if (!data.analytics) data.analytics = [];
      if (!data.settings) data.settings = DEFAULT_SETTINGS;

      // Force admin username to have passwordHash of "123456" for SEO and compliance
      let adminUser = data.adminUsers.find(u => u.username === 'admin');
      if (adminUser) {
        adminUser.passwordHash = passwordHash;
      } else {
        data.adminUsers.push({
          id: 'admin_1',
          username: 'admin',
          passwordHash,
          createdAt: new Date().toISOString(),
        });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    } catch (e) {
      console.error('Error parsing db.json, generating default:', e);
    }
  }

  // Generate initial database structure with a default admin user "admin" / "123456"
  const initialDB: AppSchema = {
    adminUsers: [
      {
        id: 'admin_1',
        username: 'admin',
        passwordHash,
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

  fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
  return initialDB;
}

export function getDB(): AppSchema {
  return initDB();
}

export function saveDB(data: AppSchema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function backupDB() {
  const data = getDB();
  const dateStr = new Date().toISOString().split('T')[0];
  const backupFile = path.join(DB_DIR, `db_backup_${dateStr}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf-8');
  logEvent('backup', `Database backup created automatically for date ${dateStr}`);
}

export interface ErrorLog {
  timestamp: string;
  type: string;
  message: string;
}

export function logEvent(type: string, message: string) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  let logs: ErrorLog[] = [];
  if (fs.existsSync(LOGS_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    } catch {
      logs = [];
    }
  }
  logs.unshift({
    timestamp: new Date().toISOString(),
    type,
    message,
  });
  // Keep last 500 logs
  if (logs.length > 500) {
    logs = logs.slice(0, 500);
  }
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

export function getLogs(): ErrorLog[] {
  if (fs.existsSync(LOGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }
  return [];
}
