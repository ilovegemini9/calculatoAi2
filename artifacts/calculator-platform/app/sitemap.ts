import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

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
  return CALCULATORS.map((calc) => ({
    url: `${baseUrl}/${calc.slug}-calculator`,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = await getDb();
    const seo = getSeoSettings(db.settings.seo);
    if (!seo.sitemap.enabled) return [];

    const baseUrl = seo.canonicalUrl || siteConfig.url;
    const staticEntries = seo.sitemap.includeStaticPages ? staticPages(baseUrl) : [];
    const calculatorEntries = seo.sitemap.includeCalculators ? calculatorPages(baseUrl) : [];
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

    return [...staticEntries, ...calculatorEntries, ...blogIndex, ...publishedArticles, ...customPages];
  } catch {
    // Keep the public discovery graph complete even if DB is unavailable.
    const baseUrl = siteConfig.url;
    return [...staticPages(baseUrl), ...calculatorPages(baseUrl)];
  }
}
