export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Calculator {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    inputs?: CalculatorInput[];
    outputs?: CalculatorOutput[];
    calculateBody?: string;
    howToUse?: string[];
    faqItems?: FaqItem[];
    shortDescription?: string;
    schemaJsonLd?: string;
  };
  settings: {
    customFormula?: string;
  };
  createdAt: string;
}

export interface CalculatorInput {
  name: string;
  label: string;
  type: 'number' | 'select' | 'date' | 'text';
  defaultValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
}

export interface CalculatorOutput {
  name: string;
  label: string;
  suffix?: string;
  highlight?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Article {
  id: string;
  calculatorId: string;
  slug: string;
  title: string;
  content: string;
  status: 'draft' | 'pending_review' | 'published';
  seoData: {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl: string;
  };
  version: number;
  createdAt: string;
}

export interface ArticleVersion {
  id: string;
  articleId: string;
  content: string;
  createdAt: string;
}

export interface Redirect {
  id: string;
  oldUrl: string;
  newUrl: string;
  statusCode: number;
  createdAt: string;
}

export interface Analytic {
  id: string;
  calculatorId: string;
  date: string;
  views: number;
}

export interface SystemSettings {
  openrouterApiKey: string;
  adsenseEnabled: boolean;
  adsenseCode: string;
  analyticsCode: string;
  featureFlags: {
    aiEnabled: boolean;
    maintenanceMode: boolean;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  route: string;
}

export interface BackupEntry {
  id: string;
  date: string;
  size: string;
  status: 'Completed' | 'Pending';
  type: string;
}

export interface AppSchema {
  adminUsers: AdminUser[];
  calculators: Calculator[];
  articles: Article[];
  articleVersions: ArticleVersion[];
  redirects: Redirect[];
  analytics: Analytic[];
  settings: SystemSettings;
  logs: LogEntry[];
  backups: BackupEntry[];
}
