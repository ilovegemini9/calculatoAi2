import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let db;
  let seo;
  try {
    db = await getDb();
    seo = getSeoSettings(db.settings.seo);
  } catch {
    const baseUrl = siteConfig.url;
    return CALCULATORS.map((calc) => ({
      url: `${baseUrl}/${calc.slug}-calculator`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  }

  const baseUrl = seo.canonicalUrl || siteConfig.url;
  const staticPages: MetadataRoute.Sitemap = seo.sitemap.includeStaticPages ? [
    { url: baseUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/sitemap`, changeFrequency: 'weekly', priority: 0.3 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.4 },
  ] : [];

  const calculatorPages: MetadataRoute.Sitemap = seo.sitemap.includeCalculators
    ? CALCULATORS.map((calc) => ({
        url: `${baseUrl}/${calc.slug}-calculator`,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }))
    : [];

  const customPages: MetadataRoute.Sitemap = seo.sitemap.customUrls
    .filter((url) => url.trim())
    .map((url) => ({ url: url.trim(), changeFrequency: 'weekly' as const, priority: 0.5 }));

  const publishedArticles: MetadataRoute.Sitemap = seo.sitemap.enabled
    ? db.articles
        .filter((a) => a.status === 'published')
        .map((a) => ({
          url: `${baseUrl}/blog/${a.slug}`,
          lastModified: a.updatedAt || a.createdAt || undefined,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
    : [];

  const blogIndex: MetadataRoute.Sitemap =
    seo.sitemap.enabled && publishedArticles.length > 0
      ? [{ url: `${baseUrl}/blog`, changeFrequency: 'daily' as const, priority: 0.6 }]
      : [];

  return seo.sitemap.enabled
    ? [...staticPages, ...calculatorPages, ...blogIndex, ...publishedArticles, ...customPages]
    : [];
}
