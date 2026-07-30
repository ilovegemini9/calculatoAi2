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
    inputs?: any[];
    outputs?: any[];
    calculateBody?: string;
    howToUse?: string[];
    faqItems?: { question: string; answer: string }[];
    shortDescription?: string;
    schemaJsonLd?: string;
  };
  settings: {
    customFormula?: string;
  };
  createdAt: string;
}

export interface SuggestedCalculator {
  calculatorId: string;
  slug: string;
  name: string;
  description: string;
  category: string;
}

export interface RelatedArticle {
  articleId: string;
  slug: string;
  title: string;
  description: string;
}

export interface InternalLinkSuggestion {
  anchorText: string;
  targetSlug: string;
  targetTitle: string;
  targetType: 'calculator' | 'article';
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
  updatedAt?: string;
  // Related Content Engine (Phase 8)
  suggestedCalculator?: SuggestedCalculator | null;
  relatedCalculators?: string[];
  relatedArticles?: RelatedArticle[];
  internalLinkSuggestions?: InternalLinkSuggestion[];
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
  date: string; // YYYY-MM-DD
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

export interface AppSchema {
  adminUsers: AdminUser[];
  calculators: Calculator[];
  articles: Article[];
  articleVersions: ArticleVersion[];
  redirects: Redirect[];
  analytics: Analytic[];
  settings: SystemSettings;
}
