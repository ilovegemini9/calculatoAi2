import { CALCULATORS } from '@/config/calculators';
import { siteConfig } from '@/config/site';
import type { SeoSettings } from './types';

const defaultJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
};

export function defaultLlmsTxt(baseUrl = siteConfig.url): string {
  const calculators = CALCULATORS.map(
    (calc) =>
      `- [${calc.name}](${baseUrl}/${calc.slug}-calculator)\n  ${calc.description}`,
  ).join('\n\n');

  return `# ${siteConfig.name} — llms.txt
# https://llmstxt.org
# AI/LLM access policy for ${siteConfig.name} calculator platform

## Site Overview
${siteConfig.name} provides free, privacy-first online calculators for finance,
fitness, math, and lifestyle. All computations run client-side in the browser.
No personal data is stored or transmitted.

## Available Calculators

${calculators}

## Formulas & Methodology
All formulas are validated against primary sources (WHO, CDC, Mifflin et al.,
standard amortization finance). See each calculator page for full formula
breakdowns, worked examples, and authoritative citations.

## Licensing & Attribution
Content is freely usable for informational purposes. Attribution appreciated.
Contact: ${baseUrl}/contact
`;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  metaTitle: 'Free Online Calculators for Finance, Math, Health & More',
  metaDescription: siteConfig.description,
  canonicalUrl: siteConfig.url,
  openGraph: {
    title: 'Free Online Calculators for Finance, Math, Health & More',
    description: siteConfig.description,
    image: siteConfig.ogImage,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online Calculators for Finance, Math, Health & More',
    description: siteConfig.description,
    image: siteConfig.ogImage,
  },
  jsonLd: JSON.stringify(defaultJsonLd, null, 2),
  sitemap: {
    enabled: true,
    includeStaticPages: true,
    includeCalculators: true,
    customUrls: [],
  },
  robots: {
    enabled: true,
    content: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${siteConfig.url}/sitemap.xml
`,
  },
  rss: {
    enabled: true,
    title: `${siteConfig.name} — Free Online Calculators`,
    description: siteConfig.description,
  },
  llmsTxt: {
    enabled: true,
    content: defaultLlmsTxt(),
  },
  googleSearchConsole: {
    propertyUrl: '',
    verificationCode: '',
  },
};

export function getSeoSettings(raw?: Partial<SeoSettings> | null): SeoSettings {
  return {
    ...DEFAULT_SEO_SETTINGS,
    ...raw,
    openGraph: { ...DEFAULT_SEO_SETTINGS.openGraph, ...(raw?.openGraph ?? {}) },
    twitter: { ...DEFAULT_SEO_SETTINGS.twitter, ...(raw?.twitter ?? {}) },
    sitemap: { ...DEFAULT_SEO_SETTINGS.sitemap, ...(raw?.sitemap ?? {}) },
    robots: { ...DEFAULT_SEO_SETTINGS.robots, ...(raw?.robots ?? {}) },
    rss: { ...DEFAULT_SEO_SETTINGS.rss, ...(raw?.rss ?? {}) },
    llmsTxt: { ...DEFAULT_SEO_SETTINGS.llmsTxt, ...(raw?.llmsTxt ?? {}) },
    googleSearchConsole: {
      ...DEFAULT_SEO_SETTINGS.googleSearchConsole,
      ...(raw?.googleSearchConsole ?? {}),
    },
  };
}

export function parseSeoJsonLd(jsonLd: string): unknown | null {
  if (!jsonLd.trim()) return null;
  return JSON.parse(jsonLd);
}