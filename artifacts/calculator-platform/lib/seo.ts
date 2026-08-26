import { CALCULATORS } from '../config/calculators';
import { siteConfig } from '../config/site';
import type { SeoSettings } from './types';
import { KEYWORD_CLUSTERS, getKeywordClusterId } from '../config/keyword-clusters';

const CANONICAL_ORIGIN = 'https://www.luckyhoroscope.online';
const APEX_ORIGIN = 'https://luckyhoroscope.online';
const BROKEN_OG_IMAGE = '/og-image.png';

function normalizeOrigin(value: string): string {
  return value.replace(new RegExp(`^${APEX_ORIGIN}`), CANONICAL_ORIGIN);
}

function normalizeAsset(value: string): string {
  const normalized = normalizeOrigin(value || '');
  const pathname = normalized.startsWith(CANONICAL_ORIGIN)
    ? normalized.slice(CANONICAL_ORIGIN.length)
    : normalized;
  return pathname === BROKEN_OG_IMAGE ? '/icon.svg' : normalized;
}

const defaultJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: CANONICAL_ORIGIN,
  description: siteConfig.description,
};

function calculatorLink(calc: (typeof CALCULATORS)[number], baseUrl: string): string {
  return `- [${calc.name}](${baseUrl}/${calc.slug}-calculator)\n  ${calc.description}`;
}

export function defaultLlmsTxt(baseUrl = CANONICAL_ORIGIN): string {
  const normalizedBase = normalizeOrigin(baseUrl);
  const sections = KEYWORD_CLUSTERS.map((cluster) => {
    const calculators = CALCULATORS.filter((calc) => getKeywordClusterId(calc.slug) === cluster.id);
    return `## ${cluster.label}\n${cluster.description}\n\n${calculators.map((calc) => calculatorLink(calc, normalizedBase)).join('\n\n')}`;
  }).join('\n\n');

  return `# ${siteConfig.name} — llms.txt\n> ${siteConfig.name} provides free, privacy-first calculators for finance, health, math, and everyday decisions. Results run in the browser and each route explains its inputs, formula, assumptions, and related tools.\n\n# https://llmstxt.org\n# AI/LLM access policy for ${siteConfig.name} calculator platform\n\n## Site Overview\n${siteConfig.name} provides free, privacy-first online calculators for finance,\nfitness, math, and lifestyle. All computations run client-side in the browser.\nNo personal data is stored or transmitted.\n\n${sections}\n\n## Formulas & Methodology\nEach calculator page states its route-specific formula, variable definitions,\nworked examples, limitations, and source links where applicable. Do not treat\noutputs as professional financial, medical, legal, or tax advice.\n\n## Licensing & Attribution\nContent is freely usable for informational purposes. Attribution appreciated.\nContact: ${normalizedBase}/contact\n`;
}

/** Preserve editorial/admin text while guaranteeing every catalog route is listed once. */
export function ensureLlmsCalculatorCoverage(content: string, baseUrl = CANONICAL_ORIGIN): string {
  const normalizedBase = normalizeOrigin(baseUrl);
  const existing = (content || '').replaceAll(APEX_ORIGIN, CANONICAL_ORIGIN);
  const missing = CALCULATORS.filter(
    (calc) => !existing.includes(`${normalizedBase}/${calc.slug}-calculator`),
  );
  if (missing.length === 0) return existing;

  const grouped = KEYWORD_CLUSTERS.map((cluster) => {
    const calculators = missing.filter((calc) => getKeywordClusterId(calc.slug) === cluster.id);
    return calculators.length
      ? `## Additional ${cluster.label}\n${calculators.map((calc) => calculatorLink(calc, normalizedBase)).join('\n\n')}`
      : '';
  }).filter(Boolean).join('\n\n');

  return `${existing.trim()}\n\n## Full Calculator Coverage\nThe following canonical routes complete the public calculator directory.\n\n${grouped}\n`;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  metaTitle: 'Free Online Calculators for Finance, Math, Health & More',
  metaDescription: siteConfig.description,
  canonicalUrl: CANONICAL_ORIGIN,
  openGraph: {
    title: 'Free Online Calculators for Finance, Math, Health & More',
    description: siteConfig.description,
    image: '/icon.svg',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online Calculators for Finance, Math, Health & More',
    description: siteConfig.description,
    image: '/icon.svg',
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
    content: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`,
  },
  rss: {
    enabled: true,
    title: `${siteConfig.name} — Free Online Calculators`,
    description: siteConfig.description,
  },
  llmsTxt: {
    enabled: true,
    content: defaultLlmsTxt(CANONICAL_ORIGIN),
  },
  googleSearchConsole: {
    propertyUrl: '',
    verificationCode: '',
  },
};

export function getSeoSettings(raw?: Partial<SeoSettings> | null): SeoSettings {
  const merged = {
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

  // Normalize known legacy apex-domain values at read time. This changes no
  // stored settings; it only prevents mixed-host SEO output at runtime.
  const canonicalUrl = normalizeOrigin(merged.canonicalUrl || CANONICAL_ORIGIN);
  const openGraphImage = normalizeAsset(merged.openGraph.image);
  const twitterImage = normalizeAsset(merged.twitter.image);
  const robotsContent = merged.robots.content.replaceAll(APEX_ORIGIN, CANONICAL_ORIGIN);
  const llmsContent = (merged.llmsTxt.content || '').replaceAll(APEX_ORIGIN, CANONICAL_ORIGIN);

  return {
    ...merged,
    canonicalUrl,
    openGraph: { ...merged.openGraph, image: openGraphImage },
    twitter: { ...merged.twitter, image: twitterImage },
    robots: { ...merged.robots, content: robotsContent },
    llmsTxt: { ...merged.llmsTxt, content: llmsContent },
  };
}

export function parseSeoJsonLd(jsonLd: string): unknown | null {
  if (!jsonLd.trim()) return null;
  return JSON.parse(jsonLd);
}
