export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface AdminSession {
  id: string;
  username: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: number;
}

export interface TestCase {
  name: string;
  type: 'unit' | 'edge' | 'formula';
  inputs: Record<string, number | string>;
  expectedOutputs: Record<string, number | string>;
  tolerance?: number;
}

export interface TestResult {
  name: string;
  type: 'unit' | 'edge' | 'formula';
  passed: boolean;
  actual?: Record<string, unknown>;
  expected: Record<string, number | string>;
  error?: string;
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
    howToUse?: string[];
    faqItems?: FaqItem[];
    shortDescription?: string;
    schemaJsonLd?: string;
    formula?: {
      expression: string;
      variables: { symbol: string; definition: string }[];
      notes?: string;
    };
    examples?: {
      title: string;
      scenario: string;
      steps: string[];
      result: string;
    }[];
    internalLinks?: { text: string; slug: string }[];
    tests?: TestCase[];
    testStatus?: 'pending' | 'passed' | 'failed';
    lastTestRun?: string;
    testResults?: TestResult[];
    opportunityData?: {
      searchVolume: string;
      competition: string;
      trend: string;
      opportunityScore: number;
      estimatedTraffic: string;
    };
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

export interface ArticleKeywordData {
  keyword: string;
  searchVolume: string;
  competition: string;
  difficulty: number;
  opportunityScore: number;
  trend: string;
  estimatedCtr: string;
}

export interface SuggestedCalculator {
  calculatorId: string;
  slug: string;
  name: string;
  reason: string;
}

export interface AppSchema {
  adminUsers: AdminUser[];
  sessions: AdminSession[];
  calculators: Calculator[];
  articles: unknown[];
  articleVersions: unknown[];
  redirects: unknown[];
  analytics: { id: string; date: string; views: number; uniqueVisitors: number }[];
  settings: SystemSettings;
  logs: { id: string; timestamp: string; level: string; message: string; route?: string }[];
  backups: unknown[];
}

export interface SystemSettings {
  openrouterApiKey: string;
  serpApiKeyEncrypted: string;
  adsenseEnabled: boolean;
  adsenseCode: string;
  analyticsCode: string;
  seo: unknown;
  ads: unknown;
  verification: unknown;
  ai: unknown;
  featureFlags: {
    aiEnabled: boolean;
    maintenanceMode: boolean;
  };
}
