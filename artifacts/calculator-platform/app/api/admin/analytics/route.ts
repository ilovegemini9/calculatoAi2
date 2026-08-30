export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { CALCULATORS } from '@/config/calculators';
import { getGoogleToken, googleClientConfigured, googleSearchConsoleSiteUrl, refreshGoogleToken, setGoogleToken } from '@/lib/google-search-console';

type GscRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
type GscResponse = { rows?: GscRow[] };

async function gscQuery(accessToken: string, body: Record<string, unknown>): Promise<GscResponse> {
  const res = await fetch(
    'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(googleSearchConsoleSiteUrl()) + '/searchAnalytics/query',
    {
      method: 'POST',
      headers: { authorization: 'Bearer ' + accessToken, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error('Search Console request failed (' + res.status + ').');
  return res.json() as Promise<GscResponse>;
}

function date(daysAgo: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - daysAgo);
  return value.toISOString().slice(0, 10);
}

async function loadSearchConsole() {
  if (!googleClientConfigured()) return { configured: false, connected: false };
  const stored = await getGoogleToken();
  if (!stored) return { configured: true, connected: false };

  const token = await refreshGoogleToken(stored);
  const startDate = date(28);
  const endDate = date(1);
  const base = { startDate, endDate, rowLimit: 100 };

  const [summary, queries, pages, countries, devices] = await Promise.all([
    gscQuery(token.access_token, base),
    gscQuery(token.access_token, { ...base, dimensions: ['query'], rowLimit: 50 }),
    gscQuery(token.access_token, { ...base, dimensions: ['page'], rowLimit: 25 }),
    gscQuery(token.access_token, { ...base, dimensions: ['country'], rowLimit: 25 }),
    gscQuery(token.access_token, { ...base, dimensions: ['device'], rowLimit: 10 }),
  ]);

  const totals = (summary.rows || []).reduce(
    (acc, row) => ({
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0),
    }),
    { clicks: 0, impressions: 0 },
  );
  const clicks = (queries.rows || []).reduce((sum, row) => sum + (row.clicks || 0), 0);
  const impressions = (queries.rows || []).reduce((sum, row) => sum + (row.impressions || 0), 0);
  const weightedPosition = impressions
    ? (queries.rows || []).reduce((sum, row) => sum + (row.position || 0) * (row.impressions || 0), 0) / impressions
    : null;

  return {
    configured: true,
    connected: true,
    refreshedToken: token,
    range: { startDate, endDate },
    summary: {
      clicks: totals.clicks || clicks,
      impressions: totals.impressions || impressions,
      ctr: (totals.impressions || impressions) ? (totals.clicks || clicks) / (totals.impressions || impressions) : 0,
      position: weightedPosition,
    },
    queries: (queries.rows || []).map((row) => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    })),
    pages: (pages.rows || []).map((row) => ({
      page: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    })),
    countries: (countries.rows || []).map((row) => ({
      country: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
    })),
    devices: (devices.rows || []).map((row) => ({
      device: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
    })),
  };
}

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await getDb();
    const dynamicCalcs = db.calculators;
    const staticCount = CALCULATORS.length;
    const dynamicPublished = dynamicCalcs.filter((c) => c.status === 'active').length;
    const dynamicDraft = dynamicCalcs.filter((c) => c.status === 'inactive').length;

    const analyticsByDate: Record<string, { views: number; calculations: number }> = {};
    for (const entry of db.analytics) {
      if (!analyticsByDate[entry.date]) analyticsByDate[entry.date] = { views: 0, calculations: 0 };
      analyticsByDate[entry.date].views += entry.views;
    }

    const trends = Object.entries(analyticsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([day, data]) => ({
        date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: data.views,
        calculations: data.calculations,
      }));

    let searchConsole: any;
    try {
      searchConsole = await loadSearchConsole();
    } catch (error) {
      searchConsole = {
        configured: googleClientConfigured(),
        connected: false,
        error: error instanceof Error ? error.message : 'Search Console sync failed.',
      };
    }

    const trafficEvents = Array.isArray((db as any).trafficEvents) ? (db as any).trafficEvents : [];
    const sourceMap = new Map<string, { source: string; medium: string; visits: number }>();
    const referralMap = new Map<string, number>();
    for (const event of trafficEvents) {
      const key = `${event.source}|${event.medium}`;
      const current = sourceMap.get(key) || { source: event.source || 'Direct', medium: event.medium || 'direct', visits: 0 };
      current.visits += 1;
      sourceMap.set(key, current);
      if (event.medium === 'referral' && event.referrerHost) {
        referralMap.set(event.referrerHost, (referralMap.get(event.referrerHost) || 0) + 1);
      }
    }
    const trafficSources = [...sourceMap.values()].sort((a, b) => b.visits - a.visits).slice(0, 20);
    const referrals = [...referralMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([referrer, visits]) => ({ referrer, visits }));

    const aiEvents = trafficEvents.filter((event: any) => event.medium === 'ai');
    const aiMap = new Map<string, number>();
    const aiPageMap = new Map<string, number>();
    const aiDayMap = new Map<string, number>();
    for (const event of aiEvents) {
      aiMap.set(event.source || 'Unknown AI', (aiMap.get(event.source || 'Unknown AI') || 0) + 1);
      aiPageMap.set(event.path || '/', (aiPageMap.get(event.path || '/') || 0) + 1);
      const day = String(event.timestamp || '').slice(0, 10);
      if (day) aiDayMap.set(day, (aiDayMap.get(day) || 0) + 1);
    }
    const totalAiVisits = aiEvents.length;
    const aiSources = [...aiMap.entries()].sort((a, b) => b[1] - a[1]).map(([source, visits]) => ({
      source, visits, share: totalAiVisits ? visits / totalAiVisits : 0,
    }));
    const aiPages = [...aiPageMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([page, visits]) => ({ page, visits }));
    const aiTrend = [...aiDayMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, visits]) => ({ date, visits }));

    const response = NextResponse.json({
      totalDynamic: dynamicCalcs.length,
      totalArticles: db.articles.length,
      totalRedirects: db.redirects.length,
      calcStats: {
        total: staticCount + dynamicCalcs.length,
        staticCount,
        dynamicCount: dynamicCalcs.length,
        published: staticCount + dynamicPublished,
        draft: dynamicDraft,
        disabled: 0,
      },
      articleStats: {
        total: db.articles.length,
        published: db.articles.filter((a) => a.status === 'published').length,
        draft: db.articles.filter((a) => a.status === 'draft').length,
        pendingReview: db.articles.filter((a) => a.status === 'pending_review').length,
        scheduled: 0,
      },
      trends,
      traffic: { totalTracked: trafficEvents.length, sources: trafficSources, referrals },
      aiTraffic: { totalVisits: totalAiVisits, shareOfTracked: trafficEvents.length ? totalAiVisits / trafficEvents.length : 0, sources: aiSources, pages: aiPages, trend: aiTrend },
      searchConsole,
      settings: {
        adsenseEnabled: db.settings.adsenseEnabled,
        adsenseCode: db.settings.adsenseCode,
        analyticsCode: db.settings.analyticsCode,
      },
    });

    if (searchConsole?.refreshedToken) setGoogleToken(response, searchConsole.refreshedToken);
    return response;
  } catch (err) {
    console.error('[API ERROR - /api/admin/analytics]:', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
