import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getDb, saveDb } from '@/lib/db';
import { getSeoSettings, parseSeoJsonLd } from '@/lib/seo';
import type { SeoSettings } from '@/lib/types';

function statusFor(enabled: boolean, configured: boolean, label: string) {
  if (!enabled) return { label, status: 'Disabled', tone: 'neutral' as const };
  return configured
    ? { label, status: 'Live', tone: 'healthy' as const }
    : { label, status: 'Needs setup', tone: 'warning' as const };
}

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const seo = getSeoSettings(db.settings.seo);
  const indexing = [
    statusFor(seo.sitemap.enabled, seo.sitemap.includeCalculators || seo.sitemap.customUrls.length > 0, 'XML Sitemap'),
    statusFor(seo.robots.enabled, Boolean(seo.robots.content.trim()), 'Robots'),
    statusFor(seo.rss.enabled, Boolean(seo.rss.title.trim()), 'RSS Feed'),
    statusFor(seo.llmsTxt.enabled, Boolean(seo.llmsTxt.content.trim()), 'llms.txt'),
    statusFor(Boolean(seo.canonicalUrl), Boolean(seo.canonicalUrl), 'Canonical'),
    statusFor(
      Boolean(seo.googleSearchConsole.propertyUrl),
      Boolean(seo.googleSearchConsole.verificationCode),
      'Google Search Console',
    ),
  ];

  return NextResponse.json({
    seo,
    indexing,
    summary: {
      live: indexing.filter((item) => item.status === 'Live').length,
      total: indexing.length,
      verified: Boolean(seo.googleSearchConsole.verificationCode),
    },
  });
}

export async function POST(req: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await req.json()) as Partial<SeoSettings>;
    const db = getDb();
    const current = getSeoSettings(db.settings.seo);
    const next = getSeoSettings({
      ...current,
      ...payload,
      openGraph: { ...current.openGraph, ...(payload.openGraph ?? {}) },
      twitter: { ...current.twitter, ...(payload.twitter ?? {}) },
      sitemap: { ...current.sitemap, ...(payload.sitemap ?? {}) },
      robots: { ...current.robots, ...(payload.robots ?? {}) },
      rss: { ...current.rss, ...(payload.rss ?? {}) },
      llmsTxt: { ...current.llmsTxt, ...(payload.llmsTxt ?? {}) },
      googleSearchConsole: {
        ...current.googleSearchConsole,
        ...(payload.googleSearchConsole ?? {}),
      },
    });

    try {
      parseSeoJsonLd(next.jsonLd);
    } catch {
      return NextResponse.json({ error: 'JSON-LD must be valid JSON before it can be saved.' }, { status: 400 });
    }

    db.settings.seo = next;
    saveDb(db);
    return NextResponse.json({ success: true, seo: next });
  } catch (error) {
    console.error('Save SEO settings error:', error);
    return NextResponse.json({ error: 'Unable to save SEO settings.' }, { status: 500 });
  }
}