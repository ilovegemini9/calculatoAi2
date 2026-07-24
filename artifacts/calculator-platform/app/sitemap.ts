import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

export const revalidate = 0;

export default function sitemap(): MetadataRoute.Sitemap {
  const db = getDb();
  const seo = getSeoSettings(db.settings.seo);
  const baseUrl = seo.canonicalUrl || siteConfig.url;
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = seo.sitemap.includeStaticPages ? [
    {
       url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
       url: `${baseUrl}/sitemap`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.3,
    },
    {
       url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
       url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
       url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
       url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ] : [];

  const calculatorPages: MetadataRoute.Sitemap = seo.sitemap.includeCalculators ? CALCULATORS.map((calc) => ({
     url: `${baseUrl}/${calc.slug}-calculator`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  })) : [];

  const customPages: MetadataRoute.Sitemap = seo.sitemap.customUrls
    .filter((url) => url.trim())
    .map((url) => ({ url: url.trim(), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.5 }));

  // Published blog articles
  const publishedArticles: MetadataRoute.Sitemap = seo.sitemap.enabled
    ? db.articles
        .filter((a) => a.status === 'published')
        .map((a) => ({
          url: `${baseUrl}/blog/${a.slug}`,
          lastModified: a.updatedAt || a.createdAt || now,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
    : [];

  // Blog index page (only if there are published articles)
  const blogIndex: MetadataRoute.Sitemap =
    seo.sitemap.enabled && publishedArticles.length > 0
      ? [{ url: `${baseUrl}/blog`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.6 }]
      : [];

  return seo.sitemap.enabled
    ? [...staticPages, ...calculatorPages, ...blogIndex, ...publishedArticles, ...customPages]
    : [];
}
