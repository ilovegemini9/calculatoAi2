import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const fallbackBaseUrl = siteConfig.url.replace(/\/$/, '');

  try {
    const db = await getDb();
    const seo = getSeoSettings(db.settings.seo);
    const baseUrl = (seo.canonicalUrl || fallbackBaseUrl).replace(/\/$/, '');

    if (!seo.robots.enabled) {
      return { rules: [{ userAgent: '*', allow: '/' }], sitemap: `${baseUrl}/sitemap.xml`, host: baseUrl };
    }

    // Preserve the safe platform defaults even when custom policy text is edited in Admin.
    const disallow = ['/api/', '/admin/'];
    return {
      rules: [{ userAgent: '*', allow: '/', disallow }],
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  } catch {
    return {
      rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] }],
      sitemap: `${fallbackBaseUrl}/sitemap.xml`,
      host: fallbackBaseUrl,
    };
  }
}
