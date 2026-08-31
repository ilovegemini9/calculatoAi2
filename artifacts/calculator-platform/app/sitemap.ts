import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';
import { getTrafficPriority } from '@/lib/seo-priority';
import { checkP0Quality } from '@/lib/p0-quality-gate';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function staticPages(baseUrl: string): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/sitemap`, changeFrequency: 'weekly', priority: 0.3 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.4 },
  ];
}

function calculatorPages(baseUrl: string): MetadataRoute.Sitemap {
  return CALCULATORS.filter((calc) => {
    const traffic = getTrafficPriority(calc.slug);
    return traffic?.priority !== 'P0' || checkP0Quality(calc.slug, calc).indexable;
  }).map((calc) => {
    const traffic = getTrafficPriority(calc.slug);
    return {
      url: `${baseUrl}/${calc.slug}-calculator`,
      changeFrequency: traffic ? 'daily' as const : 'weekly' as const,
      priority: traffic?.priority === 'P0' ? 1.0 : traffic?.priority === 'P1' ? 0.9 : 0.8,
    };
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = await getDb();
    const seo = getSeoSettings(db.settings.seo);
    if (!seo.sitemap.enabled) return [];

    const baseUrl = seo.canonicalUrl || siteConfig.url;
    const staticEntries = seo.sitemap.includeStaticPages ? staticPages(baseUrl) : [];
    const staticCalculatorSlugs = new Set(CALCULATORS.map((c) => c.slug));
    const calculatorEntries = seo.sitemap.includeCalculators ? calculatorPages(baseUrl) : [];

    const dynamicEntries: MetadataRoute.Sitemap = seo.sitemap.includeCalculators
      ? db.calculators
          .filter((c) => c.status === 'active' && !staticCalculatorSlugs.has(c.slug))
          .map((c) => ({
            url: `${baseUrl}/${c.slug}-calculator`,
            changeFrequency: 'weekly' as const,
            priority: 0.75,
          }))
      : [];

    const customPages: MetadataRoute.Sitemap = seo.sitemap.customUrls
      .filter((url) => url.trim())
      .map((url) => ({ url: url.trim(), changeFrequency: 'weekly' as const, priority: 0.5 }));
    const publishedArticles: MetadataRoute.Sitemap = db.articles
      .filter((a) => a.status === 'published')
      .map((a) => ({
        url: `${baseUrl}/blog/${a.slug}`,
        lastModified: a.updatedAt || a.createdAt || undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    const blogIndex = publishedArticles.length > 0
      ? [{ url: `${baseUrl}/blog`, changeFrequency: 'daily' as const, priority: 0.6 }]
      : [];

    return [...staticEntries, ...calculatorEntries, ...dynamicEntries, ...blogIndex, ...publishedArticles, ...customPages];
  } catch {
    const baseUrl = siteConfig.url;
    return [...staticPages(baseUrl), ...calculatorPages(baseUrl)];
  }
}