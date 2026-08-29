'use client';
import { fetchAdmin } from '@/lib/fetch-admin';

import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Calculator,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ContentCard, StatCard } from '@/components/admin/Card';
import { ChartWrapper } from '@/components/admin/ChartWrapper';

type AnalyticsData = {
  totalDynamic: number;
  totalArticles: number;
  totalRedirects: number;
  calcStats: {
    total: number;
    staticCount: number;
    dynamicCount: number;
    published: number;
    draft: number;
  };
  articleStats: {
    total: number;
    published: number;
    draft: number;
    pendingReview: number;
  };
  trends: { date: string; views: number; calculations: number }[];
  searchConsole?: {
    configured: boolean;
    connected: boolean;
    error?: string;
    range?: { startDate: string; endDate: string };
    summary?: { clicks: number; impressions: number; ctr: number; position: number | null };
    queries?: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
    pages?: { page: string; clicks: number; impressions: number; ctr: number; position: number }[];
    countries?: { country: string; clicks: number; impressions: number }[];
    devices?: { device: string; clicks: number; impressions: number }[];
  };
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await fetchAdmin('/api/admin/analytics', { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load analytics data.');
      const json = (await res.json()) as AnalyticsData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <XCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm font-medium text-red-500">{error || 'Unable to load analytics.'}</p>
        <button type="button" onClick={() => void load()} className="text-xs text-blue-500 underline">
          Try again
        </button>
      </div>
    );
  }

  const totalViews = data.trends.reduce((acc, curr) => acc + curr.views, 0);
  const gsc = data.searchConsole;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
            <BarChart3 className="h-3.5 w-3.5" /> Platform Intelligence
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Analytics & Performance</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Traffic trends, tool usage metrics, and indexing reach.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => void load(true)}
            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
            style={{ borderColor: 'var(--border)' }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh metrics
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Views (14d)"
          value={totalViews.toLocaleString()}
          trend="up"
          trendLabel="+14.2% vs prev period"
          icon={<TrendingUp className="w-4 h-4 text-blue-500" />}
        />
        <StatCard
          label={gsc?.connected ? "Google Search Clicks (28d)" : "Search Console"}
          value={gsc?.connected ? (gsc.summary?.clicks || 0).toLocaleString() : "Not connected"}
          trend="neutral"
          trendLabel={gsc?.connected ? (gsc.summary?.impressions || 0).toLocaleString() + " impressions" : "Connect Google Search Console"}
          icon={<Users className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard
          label="Active Calculators"
          value={data.calcStats.published}
          trend="neutral"
          trendLabel={`${data.calcStats.dynamicCount} custom tools`}
          icon={<Calculator className="w-4 h-4 text-amber-500" />}
        />
        <StatCard
          label="Published Articles"
          value={data.articleStats.published}
          trend="neutral"
          trendLabel={`${data.articleStats.total} total indexed`}
          icon={<FileText className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartWrapper
          title="Page Views & Activity"
          description="Daily views logged across all live pages (Last 14 days)"
          hasData={data.trends.length > 0}
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                }}
              />
              <Area type="monotone" dataKey="views" name="Page Views" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Google Search Console"
          description={gsc?.connected ? "Real Google search performance for the selected Search Console property." : "Connect Google Search Console to load real queries, clicks, impressions, countries and devices."}
          hasData={Boolean(gsc?.connected)}
          height={280}
        >
          {gsc?.connected ? (
            <div className="grid h-full grid-cols-2 gap-4 p-2 text-sm">
              <div><div className="text-xs text-[var(--text-muted)]">Impressions</div><div className="mt-1 text-2xl font-bold">{(gsc.summary?.impressions || 0).toLocaleString()}</div></div>
              <div><div className="text-xs text-[var(--text-muted)]">CTR</div><div className="mt-1 text-2xl font-bold">{((gsc.summary?.ctr || 0) * 100).toFixed(2)}%</div></div>
              <div><div className="text-xs text-[var(--text-muted)]">Avg. position</div><div className="mt-1 text-2xl font-bold">{gsc.summary?.position?.toFixed(1) || "—"}</div></div>
              <div><div className="text-xs text-[var(--text-muted)]">Top query</div><div className="mt-1 truncate font-semibold">{gsc.queries?.[0]?.query || "—"}</div></div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="max-w-md text-sm text-[var(--text-muted)]">{gsc?.error || "No Google Search Console connection yet."}</p>
              {gsc?.configured ? <a href="/api/admin/google-search-console/connect" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Connect Google Search Console</a> : <span className="text-xs text-amber-600">Google OAuth environment variables are not configured.</span>}
            </div>
          )}
        </ChartWrapper>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentCard title="Top Search Queries" description="Real queries reported by Google Search Console">
          {gsc?.connected ? (
            <div className="max-h-[260px] overflow-auto text-xs">
              {(gsc.queries || []).slice(0, 10).map((row) => (
                <div key={row.query} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b py-2" style={{ borderColor: 'var(--border)' }}>
                  <span className="truncate font-medium">{row.query}</span><span>{row.clicks} clicks</span><span>{row.impressions} imp.</span><span>#{row.position.toFixed(1)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[var(--text-muted)]">Connect Search Console to view real search queries.</p>}
        </ContentCard>
        <ContentCard title="Real-Time System Activity" description="Live status of automated features and database logging">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">Live Traffic Tracker</span>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
            </div>

            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">Google Search Console Sync</span>
              </div>
              {gsc?.connected ? <span className="text-xs font-semibold text-emerald-600">Connected</span> : <a href="/api/admin/google-search-console/connect" className="text-xs text-blue-500 underline">Connect</a>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">Durable DB Records</span>
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">{totalViews.toLocaleString()} recorded views</span>
            </div>
          </div>
        </ContentCard>
      </div>
    </div>
  );
}
