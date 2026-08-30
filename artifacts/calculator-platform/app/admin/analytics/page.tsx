'use client';
import { fetchAdmin } from '@/lib/fetch-admin';
import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Calculator, FileText, Globe, Loader2, RefreshCw, TrendingUp, Users, XCircle, MousePointerClick, Eye, MapPin, Monitor, Smartphone, Tablet, ExternalLink, Search, Activity } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ContentCard, StatCard } from '@/components/admin/Card';
import { ChartWrapper } from '@/components/admin/ChartWrapper';

type AnalyticsData = {
  totalDynamic: number; totalArticles: number; totalRedirects: number;
  calcStats: { total: number; staticCount: number; dynamicCount: number; published: number; draft: number };
  articleStats: { total: number; published: number; draft: number; pendingReview: number };
  trends: { date: string; views: number; calculations: number }[];
  traffic?: { totalTracked: number; sources: { source: string; medium: string; visits: number }[]; referrals: { referrer: string; visits: number }[] };
  aiTraffic?: { totalVisits: number; shareOfTracked: number; sources: { source: string; visits: number; share: number }[]; pages: { page: string; visits: number }[]; trend: { date: string; visits: number }[] };
  searchConsole?: {
    configured: boolean; connected: boolean; error?: string; range?: { startDate: string; endDate: string };
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
    if (quiet) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchAdmin('/api/admin/analytics', { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load analytics data.');
      setData((await res.json()) as AnalyticsData);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load analytics data.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>;
  if (error || !data) return <div className="flex min-h-[420px] flex-col items-center justify-center gap-3"><XCircle className="h-8 w-8 text-red-500" /><p className="text-sm font-medium text-red-500">{error || 'Unable to load analytics.'}</p><button type="button" onClick={() => void load()} className="text-xs text-blue-500 underline">Try again</button></div>;
  const totalViews = data.trends.reduce((acc, curr) => acc + curr.views, 0);
  const gsc = data.searchConsole;
  const gscSummary = gsc?.summary;
  const formatNumber = (value?: number) => (value || 0).toLocaleString();
  const formatPercent = (value?: number) => `${((value || 0) * 100).toFixed(2)}%`;
  const countryFlag = (country: string) => {
    const code = (country || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return '🌐';
    return String.fromCodePoint(...[...code].map((char) => 127397 + char.charCodeAt(0)));
  };
  const countryLabel = (country: string) => {
    const code = (country || '').trim().toUpperCase();
    if (!code) return 'Unknown';
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
    } catch {
      return code;
    }
  };
  const deviceIcon = (device: string) => {
    const key = device.toLowerCase();
    if (key.includes('mobile')) return <Smartphone className="h-4 w-4" />;
    if (key.includes('tablet')) return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500"><BarChart3 className="h-3.5 w-3.5" /> Platform Intelligence</div><h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Analytics & Performance</h1><p className="mt-1 text-sm text-[var(--text-muted)]">Traffic trends, tool usage metrics, and indexing reach.</p></div>
        <button type="button" onClick={() => void load(true)} className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500" style={{ borderColor: 'var(--border)' }}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh metrics</button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Views (14d)" value={totalViews.toLocaleString()} trend="neutral" trendLabel="Recorded activity" icon={<TrendingUp className="w-4 h-4 text-blue-500" />} />
        <StatCard label={gsc?.connected ? 'Google Search Clicks (28d)' : 'Search Console'} value={gsc?.connected ? (gsc.summary?.clicks || 0).toLocaleString() : 'Not connected'} trend="neutral" trendLabel={gsc?.connected ? `${(gsc.summary?.impressions || 0).toLocaleString()} impressions` : 'Connect Google Search Console'} icon={<Users className="w-4 h-4 text-emerald-500" />} />
        <StatCard label="Active Calculators" value={data.calcStats.published} trend="neutral" trendLabel={`${data.calcStats.dynamicCount} custom tools`} icon={<Calculator className="w-4 h-4 text-amber-500" />} />
        <StatCard label="Published Articles" value={data.articleStats.published} trend="neutral" trendLabel={`${data.articleStats.total} total`} icon={<FileText className="w-4 h-4 text-purple-500" />} />
      </div>
      {!gsc?.connected && gsc?.configured && (
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"><Globe className="h-4 w-4 text-blue-500" /> Google Search Console</div><p className="mt-1 text-sm text-[var(--text-muted)]">Connect your Google account to see real search queries, clicks, impressions, countries, devices and landing pages.</p></div>
            <a href="/api/admin/google-search-console/connect" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Connect Google Search Console</a>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartWrapper title="Page Views & Activity" description="Daily views logged across all live pages (Last 14 days)" hasData={data.trends.length > 0} height={280}>
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} /><YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }} /><Area type="monotone" dataKey="views" name="Page Views" stroke="#2563eb" strokeWidth={2} fillOpacity={0.12} fill="#2563eb" /></AreaChart></ResponsiveContainer>
        </ChartWrapper>
        <ChartWrapper title="Google Search Console" description={gsc?.connected ? 'Real Google search performance for the configured property.' : 'Real search data will appear here after connecting Search Console.'} hasData={Boolean(gsc?.connected)} height={280}>
          {gsc?.connected ? <div className="grid h-full grid-cols-2 gap-4 p-2 text-sm"><div><div className="text-xs text-[var(--text-muted)]">Impressions</div><div className="mt-1 text-2xl font-bold">{(gsc.summary?.impressions || 0).toLocaleString()}</div></div><div><div className="text-xs text-[var(--text-muted)]">CTR</div><div className="mt-1 text-2xl font-bold">{((gsc.summary?.ctr || 0) * 100).toFixed(2)}%</div></div><div><div className="text-xs text-[var(--text-muted)]">Avg. position</div><div className="mt-1 text-2xl font-bold">{gsc.summary?.position?.toFixed(1) || '—'}</div></div><div><div className="text-xs text-[var(--text-muted)]">Top query</div><div className="mt-1 truncate font-semibold">{gsc.queries?.[0]?.query || '—'}</div></div></div> : <div className="flex h-full flex-col items-center justify-center gap-3 text-center"><p className="max-w-md text-sm text-[var(--text-muted)]">{gsc?.error || 'No Google Search Console connection yet.'}</p>{gsc?.configured ? <a href="/api/admin/google-search-console/connect" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Connect Google Search Console</a> : <span className="text-xs text-amber-600">Google OAuth environment variables are not configured.</span>}</div>}
        </ChartWrapper>
      </div>
      {data.aiTraffic && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]"><Activity className="h-4 w-4 text-violet-500" /> AI Traffic Intelligence</div><p className="mt-1 text-sm text-[var(--text-muted)]">Real browser referrals detected from AI assistants. Prompts are not exposed by referrer data.</p></div>
              <div className="flex gap-5"><div><div className="text-2xl font-bold">{formatNumber(data.aiTraffic.totalVisits)}</div><div className="text-xs text-[var(--text-muted)]">AI visits</div></div><div><div className="text-2xl font-bold">{formatPercent(data.aiTraffic.shareOfTracked)}</div><div className="text-xs text-[var(--text-muted)]">of tracked traffic</div></div></div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ContentCard title="AI Referral Sources" description="ChatGPT, Perplexity, Gemini and other detected AI assistants">
              <div className="space-y-2">
                {data.aiTraffic.sources.length ? data.aiTraffic.sources.map((item) => (
                  <div key={item.source} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                    <div><div className="font-semibold text-[var(--text-primary)]">{item.source}</div><div className="text-xs text-[var(--text-muted)]">{formatPercent(item.share)} of AI traffic</div></div>
                    <div className="font-bold">{formatNumber(item.visits)} visits</div>
                  </div>
                )) : <p className="py-8 text-center text-sm text-[var(--text-muted)]">No AI referral has been recorded yet.</p>}
              </div>
            </ContentCard>
            <ContentCard title="Top Pages from AI" description="Landing pages receiving real visits from AI assistants">
              <div className="space-y-2">
                {data.aiTraffic.pages.length ? data.aiTraffic.pages.map((item) => (
                  <div key={item.page} className="flex items-center justify-between gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="min-w-0"><div className="truncate font-semibold text-[var(--text-primary)]">{item.page}</div><div className="text-xs text-[var(--text-muted)]">AI landing page</div></div><div className="shrink-0 font-bold">{formatNumber(item.visits)}</div>
                  </div>
                )) : <p className="py-8 text-center text-sm text-[var(--text-muted)]">AI landing pages will appear automatically when referrals arrive.</p>}
              </div>
            </ContentCard>
          </div>
        </div>
      )}

      {data.traffic && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ContentCard title="Real Traffic Sources" description="Actual sources detected from browser referrers">
            <div className="space-y-2">
              {data.traffic.sources.length ? data.traffic.sources.map((item) => (
                <div key={item.source + item.medium} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                  <div><div className="font-semibold text-[var(--text-primary)]">{item.source}</div><div className="text-xs capitalize text-[var(--text-muted)]">{item.medium}</div></div>
                  <div className="text-right"><div className="font-bold">{formatNumber(item.visits)}</div><div className="text-[10px] uppercase text-[var(--text-muted)]">visits</div></div>
                </div>
              )) : <p className="py-8 text-center text-sm text-[var(--text-muted)]">No real referrer data recorded yet. New visits will appear automatically.</p>}
            </div>
          </ContentCard>
          <ContentCard title="External Referrals" description="Sites that sent visitors to CalculatorFree">
            <div className="space-y-2">
              {data.traffic.referrals.length ? data.traffic.referrals.map((item) => (
                <div key={item.referrer} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="min-w-0"><div className="truncate font-semibold text-[var(--text-primary)]">{item.referrer}</div><div className="text-xs text-[var(--text-muted)]">External referral</div></div>
                  <div className="font-bold">{formatNumber(item.visits)} visits</div>
                </div>
              )) : <p className="py-8 text-center text-sm text-[var(--text-muted)]">No external referral has been recorded yet.</p>}
            </div>
          </ContentCard>
        </div>
      )}

      {gsc?.connected && (
        <>
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-500/10 p-2"><Activity className="h-5 w-5 text-emerald-600" /></div><div><div className="font-bold text-[var(--text-primary)]">Google Search Console Connected</div><p className="text-xs text-[var(--text-muted)]">Live search performance • {gsc.range?.startDate} → {gsc.range?.endDate}</p></div></div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live data</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><MousePointerClick className="h-3.5 w-3.5 text-blue-500" /> Clicks</div><div className="mt-2 text-xl font-bold">{formatNumber(gscSummary?.clicks)}</div></div>
              <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Eye className="h-3.5 w-3.5 text-purple-500" /> Impressions</div><div className="mt-2 text-xl font-bold">{formatNumber(gscSummary?.impressions)}</div></div>
              <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> CTR</div><div className="mt-2 text-xl font-bold">{formatPercent(gscSummary?.ctr)}</div></div>
              <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Search className="h-3.5 w-3.5 text-amber-500" /> Avg. position</div><div className="mt-2 text-xl font-bold">{gscSummary?.position?.toFixed(1) || '—'}</div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ContentCard title="Top Landing Pages" description="Pages receiving the most organic search visibility">
              <div className="max-h-[330px] overflow-auto">
                {(gsc.pages || []).slice(0, 10).map((row, index) => (
                  <div key={row.page} className="group flex items-center gap-3 border-b py-3 last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600">{index + 1}</span>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[var(--text-primary)]">{row.page.replace(/^https?:\/\//, '')}</div><div className="mt-0.5 text-xs text-[var(--text-muted)]">{formatNumber(row.impressions)} impressions • position {row.position.toFixed(1)}</div></div>
                    <div className="text-right"><div className="text-sm font-bold">{formatNumber(row.clicks)}</div><div className="text-[10px] uppercase text-[var(--text-muted)]">clicks</div></div>
                    <a href={row.page} target="_blank" rel="noreferrer" className="opacity-0 transition group-hover:opacity-100"><ExternalLink className="h-4 w-4 text-blue-500" /></a>
                  </div>
                ))}
                {!(gsc.pages || []).length && <p className="py-10 text-center text-sm text-[var(--text-muted)]">Google has not reported landing-page data for this range yet.</p>}
              </div>
            </ContentCard>

            <ContentCard title="Audience Geography" description="Countries reported by Google Search Console">
              <div className="max-h-[330px] overflow-auto">
                {(gsc.countries || []).slice(0, 10).map((row, index) => {
                  const max = Math.max(...(gsc.countries || []).map((item) => item.clicks || 0), 1);
                  const width = Math.max(4, ((row.clicks || 0) / max) * 100);
                  return <div key={row.country} className="border-b py-3 last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="mb-2 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="text-lg leading-none" role="img" aria-label={countryLabel(row.country)}>{countryFlag(row.country)}</span><span className="truncate text-sm font-semibold">{countryLabel(row.country)}</span></div><span className="text-sm font-bold">{formatNumber(row.clicks)} clicks</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${width}%` }} /></div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">{formatNumber(row.impressions)} impressions</div>
                  </div>;
                })}
                {!(gsc.countries || []).length && <p className="py-10 text-center text-sm text-[var(--text-muted)]">No country data available yet.</p>}
              </div>
            </ContentCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <ContentCard title="Device Breakdown" description="Organic search traffic by device">
              <div className="space-y-3">
                {(gsc.devices || []).map((row) => <div key={row.device} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}><div className="flex items-center gap-3"><div className="rounded-md bg-slate-500/10 p-2 text-slate-500">{deviceIcon(row.device)}</div><div><div className="text-sm font-bold capitalize">{row.device.toLowerCase()}</div><div className="text-xs text-[var(--text-muted)]">{formatNumber(row.impressions)} impressions</div></div></div><div className="text-right"><div className="font-bold">{formatNumber(row.clicks)}</div><div className="text-[10px] uppercase text-[var(--text-muted)]">clicks</div></div></div>)}
                {!(gsc.devices || []).length && <p className="text-sm text-[var(--text-muted)]">No device data available yet.</p>}
              </div>
            </ContentCard>
            <ContentCard title="Search Insights" description="Quick signals from your live search data">
              <div className="space-y-4 text-sm">
                <div className="rounded-lg bg-blue-500/5 p-3"><div className="text-xs font-bold uppercase tracking-wide text-blue-600">Best query</div><div className="mt-1 truncate font-semibold">{gsc.queries?.[0]?.query || 'No query data yet'}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{formatNumber(gsc.queries?.[0]?.clicks)} clicks • {formatNumber(gsc.queries?.[0]?.impressions)} impressions</div></div>
                <div className="grid grid-cols-2 gap-3"><div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}><div className="text-xs text-[var(--text-muted)]">Tracked queries</div><div className="mt-1 text-xl font-bold">{formatNumber(gsc.queries?.length)}</div></div><div className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}><div className="text-xs text-[var(--text-muted)]">Tracked pages</div><div className="mt-1 text-xl font-bold">{formatNumber(gsc.pages?.length)}</div></div></div>
              </div>
            </ContentCard>
            <ContentCard title="Connection Status" description="Google Search Console integration health">
              <div className="space-y-3"><div className="flex items-center justify-between"><span className="text-sm">OAuth connection</span><span className="font-semibold text-emerald-600">Connected</span></div><div className="flex items-center justify-between"><span className="text-sm">Search data</span><span className="font-semibold text-emerald-600">Available</span></div><div className="flex items-center justify-between"><span className="text-sm">Refresh window</span><span className="text-xs text-[var(--text-muted)]">On demand</span></div><button type="button" onClick={() => void load(true)} className="mt-2 w-full rounded-lg border px-3 py-2 text-xs font-bold transition hover:border-blue-500 hover:text-blue-500" style={{ borderColor: 'var(--border)' }}>Refresh Search Data</button></div>
            </ContentCard>
          </div>
        </>
      )}
    </div>
  );
}
