import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { CALCULATORS } from '@/config/calculators';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  // Calculator stats — static + dynamic
  const staticCount = CALCULATORS.length;
  const dynamicCalcs = db.calculators;
  const calcStats = {
    total: staticCount + dynamicCalcs.length,
    staticCount,
    published: staticCount + dynamicCalcs.filter((c) => c.status === 'active').length,
    draft: dynamicCalcs.filter((c) => c.status === 'inactive').length,
    disabled: 0, // no disabled status in current schema
  };

  // Article stats — from db
  const articles = db.articles;
  const articleStats = {
    total: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    draft: articles.filter((a) => a.status === 'draft').length,
    pendingReview: articles.filter((a) => a.status === 'pending_review').length,
    scheduled: 0, // not yet supported
  };

  // Trends — aggregate db.analytics by date (last 14 days)
  const analyticsByDate: Record<string, { views: number; calculations: number }> = {};
  for (const entry of db.analytics) {
    if (!analyticsByDate[entry.date]) {
      analyticsByDate[entry.date] = { views: 0, calculations: 0 };
    }
    analyticsByDate[entry.date].views += entry.views;
  }

  const trends = Object.entries(analyticsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: data.views,
      calculations: data.calculations,
    }));

  return NextResponse.json({
    totalDynamic: dynamicCalcs.length,
    totalArticles: articles.length,
    totalRedirects: db.redirects.length,
    calcStats,
    articleStats,
    trends,
    settings: {
      adsenseEnabled: db.settings.adsenseEnabled,
      adsenseCode: db.settings.adsenseCode,
      analyticsCode: db.settings.analyticsCode,
    },
  });
}
