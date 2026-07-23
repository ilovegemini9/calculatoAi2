export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface TestCase {
  name: string;
  type: 'unit' | 'edge' | 'formula';
  inputs: Record<string, number | string>;
  expectedOutputs: Record<string, number | string>;
  tolerance?: number; // relative tolerance, default 0.01 (1%)
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
    calculateBody?: string;
    howToUse?: string[];
    faqItems?: FaqItem[];
    shortDescription?: string;
    schemaJsonLd?: string;
    // Extended fields added by Calculator Factory
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
  // Extended fields (optional — backward compatible)
  relatedKeywords?: string[];
  openGraph?: { title: string; description: string; url: string; type: string };
  faqItems?: { q: string; a: string }[];
  howToSteps?: string[];
  readingTime?: number;
  wordCount?: number;
  tableOfContents?: string;
  outline?: { heading: string; level: string; subpoints: string[] }[];
  relatedCalculators?: string[];
  schemaFaq?: string;
  schemaArticle?: string;
  schemaHowTo?: string;
  keywordData?: ArticleKeywordData;
  updatedAt?: string;
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
  serpApiKeyEncrypted?: string;
  adsenseEnabled: boolean;
  adsenseCode: string;
  analyticsCode: string;
  seo: SeoSettings;
  ads: AdsSettings;
  verification: VerificationSettings;
  ai: AiSettings;
  featureFlags: {
    aiEnabled: boolean;
    maintenanceMode: boolean;
  };
}

// ─── Articles Manager 2.0 ─────────────────────────────────────────────────────

export interface TopicSuggestion {
  topic: string;
  searchVolumeLabel: string | null;
  competition: 'Low' | 'Medium' | 'High' | null;
  trend: 'Rising' | 'Stable' | 'Declining' | null;
  opportunityScore: number | null;
}

export interface ResearchTitleCard {
  title: string;
  searchVolumeLabel: string | null;
  competition: 'Low' | 'Medium' | 'High' | null;
  trend: 'Rising' | 'Stable' | 'Declining' | null;
  opportunityScore: number | null;
}

export interface ResearchKeywordChip {
  keyword: string;
  searchVolumeLabel: string | null;
  competition: 'Low' | 'Medium' | 'High' | null;
  trend: 'Rising' | 'Stable' | 'Declining' | null;
}

export interface ArticleOutlineSection {
  id: string;
  type: 'h2' | 'h3' | 'faq' | 'howto' | 'examples' | 'comparison' | 'proscons' | 'internal-links' | 'related';
  heading: string;
  subpoints: string[];
}

export interface ArticleResearchSummary {
  topic: string;
  liveData: boolean;
  serpDataAvailable: boolean;
  organicCount: number;
  hasFeaturedSnippet: boolean;
  paaQuestions: string[];
  relatedSearches: string[];
  trendDirection: 'rising' | 'stable' | 'declining' | null;
  trendInterest: number | null;
  redditCount: number;
  autocomplete: string[];
  organicResults: { title: string; link: string; snippet: string }[];
  featuredSnippet: { title: string; snippet: string } | null;
  trendingQueries: string[];
  titleCards: ResearchTitleCard[];
}

export type AiProvider = 'openrouter' | 'openai' | 'gemini' | 'anthropic';

export interface AiProviderSettings {
  enabled: boolean;
  apiKeyEncrypted: string;
  defaultModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  dailyBudget: number;
  monthlyBudget: number;
}

export interface AiUsageCounters {
  dailyRequests: number;
  monthlyRequests: number;
  dailyTokens: number;
  monthlyTokens: number;
  lastDay: string;
  lastMonth: string;
  cacheVersion: number;
}

export interface AiSettings {
  activeProvider: AiProvider;
  providers: Record<AiProvider, AiProviderSettings>;
  usage: AiUsageCounters;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: 'website' | 'article';
  };
  twitter: {
    card: 'summary' | 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
  jsonLd: string;
  sitemap: {
    enabled: boolean;
    includeStaticPages: boolean;
    includeCalculators: boolean;
    customUrls: string[];
  };
  robots: {
    enabled: boolean;
    content: string;
  };
  rss: {
    enabled: boolean;
    title: string;
    description: string;
  };
  llmsTxt: {
    enabled: boolean;
    content: string;
  };
  googleSearchConsole: {
    propertyUrl: string;
    verificationCode: string;
  };
}

export type AdPlacement = 'header' | 'sidebar' | 'footer' | 'inContent';

export interface AdSlotSettings {
  enabled: boolean;
  slotId: string;
  desktopHeight: number;
  mobileHeight: number;
}

export interface AdsSettings {
  enabled: boolean;
  provider: 'adsense' | 'custom';
  publisherId: string;
  customNetworkName: string;
  customNetworkCode: string;
  slots: Record<AdPlacement, AdSlotSettings>;
}

export interface VerificationSettings {
  googleSearchConsole: {
    enabled: boolean;
    propertyUrl: string;
    verificationCode: string;
  };
  googleAdsense: {
    enabled: boolean;
    publisherId: string;
    verificationCode: string;
  };
  bing: {
    enabled: boolean;
    verificationCode: string;
  };
  yandex: {
    enabled: boolean;
    verificationCode: string;
  };
  customMetaTags: string;
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
