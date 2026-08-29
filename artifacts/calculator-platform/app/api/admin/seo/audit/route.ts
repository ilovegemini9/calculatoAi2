export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { siteConfig } from '@/config/site';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

type AuditItem = {
  label: string;
  status: 'healthy' | 'warning' | 'error';
  detail: string;
  url?: string;
};

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const seo = getSeoSettings(db.settings.seo);
  const baseUrl = (seo.canonicalUrl || siteConfig.url).replace(/\/$/, '');

  const checks: AuditItem[] = [
    {
      label: 'XML Sitemap',
      status: seo.sitemap.enabled && seo.sitemap.includeCalculators ? 'healthy' : 'warning',
      detail: seo.sitemap.enabled
        ? 'Calculator URLs are available for crawler discovery.'
        : 'Sitemap output is disabled.',
      url: `${baseUrl}/sitemap.xml`,
    },
    {
      label: 'Robots policy',
      status: seo.robots.enabled && seo.robots.content.includes('Sitemap:')
        ? 'healthy'
        : 'warning',
      detail: seo.robots.enabled
        ? 'Crawler policy is public.'
        : 'robots.txt policy is disabled or incomplete.',
      url: `${baseUrl}/robots.txt`,
    },
    {
      label: 'Canonical URL',
      status: /^https:\/\//.test(seo.canonicalUrl) ? 'healthy' : 'error',
      detail: seo.canonicalUrl
        ? `Preferred URL: ${seo.canonicalUrl}`
        : 'No canonical URL configured.',
    },
    {
      label: 'Search Console',
      status: seo.googleSearchConsole.propertyUrl ? 'healthy' : 'warning',
      detail: seo.googleSearchConsole.propertyUrl
        ? `Property configured: ${seo.googleSearchConsole.propertyUrl}`
        : 'Add the verified Search Console property.',
    },
    {
      label: 'Internal discovery',
      status: seo.sitemap.includeCalculators ? 'healthy' : 'warning',
      detail: seo.sitemap.includeCalculators
        ? 'Calculator pages are included in the public discovery graph.'
        : 'Calculator URLs are excluded from the sitemap.',
    },
    {
      label: 'Indexing directives',
      status: /noindex/i.test(seo.robots.content) ? 'warning' : 'healthy',
      detail: /noindex/i.test(seo.robots.content)
        ? 'A noindex directive was detected. Review crawler directives.'
        : 'No noindex directive detected in the configured robots policy.',
    },
  ];

  const summary = {
    healthy: checks.filter((item) => item.status === 'healthy').length,
    warning: checks.filter((item) => item.status === 'warning').length,
    error: checks.filter((item) => item.status === 'error').length,
  };

  return NextResponse.json({
    baseUrl,
    checkedAt: new Date().toISOString(),
    checks,
    summary,
    indexingNote:
      'Search engines decide when to crawl and index. This audit checks whether your public technical setup makes discovery and crawling straightforward.',
  });
}
