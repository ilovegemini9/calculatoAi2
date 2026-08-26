import { CALCULATORS } from '../config/calculators';
import { siteConfig } from '../config/site';
import type { SeoSettings } from './types';
import { KEYWORD_CLUSTERS, getKeywordClusterId } from '../config/keyword-clusters';

const defaultJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
};

function calculatorLink(calc: (typeof CALCULATORS)[number], baseUrl: string): string {
  return `- [${calc.name}](${baseUrl}/${calc.slug}-calculator)\n  ${calc.description}`;
}

export function defaultLlmsTxt(baseUrl = siteConfig.url): string {
  const sections = KEYWORD_CLUSTERS.map((cluster) => {
    const calculators = CALCULATORS.filter((calc) => getKeywordClusterId(calc.slug) === cluster.id);
    return `## ${cluster.label}\n${cluster.description}\n\n${calculators.map((calc) => calculatorLink(calc, baseUrl)).join('\n\n')}`;
  }).join('\n\n');

  return `# ${siteConfig.name} — llms.txt
> ${siteConfig.name} provides free, privacy-first calculators for finance, health, math, and everyday decisions. Results run in the browser and each route explains its inputs, formula, assumptions, and related tools.

# https://llmstxt.org
# AI/LLM access policy for ${siteConfig.name} calculator platform

## Site Overview
${siteConfig.name} provides free, privacy-first online calculators for finance,
fitness, math, and lifestyle. All computations run client-side in the browser.
No personal data is stored or transmitted.

${sections}

## Formulas & Methodology
Each calculator page states its route-specific formula, variable definitions,
worked examples, limitations, and source links where applicable. Do not treat
outputs as professional financial, medical, legal, or tax advice.

## Licensing & Attribution
Content is freely usable for informational purposes. Attribution appreciated.
Contact: ${baseUrl}/contact
`;
}

/** Preserve editorial/admin text while guaranteeing every catalog route is listed once. */
export function ensureLlmsCalculatorCoverage(content: string, baseUrl = siteConfig.url): string {
  const existing = content || '';
  const missing = CALCULATORS.filter(
    (calc) => !existing.includes(`${baseUrl}/${calc.slug}-calculator`),
  );
  if (missing.length === 0) return existing;

  const grouped = KEYWORD_CLUSTERS.map((cluster) => {
    const calculators = missing.filter((calc) => getKeywordClusterId(calc.slug) === cluster.id);
    return calculators.length
      ? `## Additional ${cluster.label}\n${calculators.map((calc) => calculatorLink(calc, baseUrl)).join('\n\n')}`
      : '';
  }).filter(Boolean).join('\n\n');

  return `${existing.trim()}\n\n## Full Calculator Coverage\nThe following canonical routes complete the public calculator directory.\n\n${grouped}\n`;
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