'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalcStats { total: number; staticCount: number; dynamicCount: number; published: number; draft: number; }
interface ArticleStats { total: number; published: number; draft: number; pendingReview: number; }
interface TrendPoint { date: string; views: number; calculations: number; }
interface AnalyticsData {
  totalDynamic: number; totalArticles: number; totalRedirects: number;
  calcStats: CalcStats; articleStats: ArticleStats; trends: TrendPoint[];
  settings: { adsenseEnabled: boolean; adsenseCode: string; analyticsCode: string; };
}
interface SystemData {
  serverTime: string; environment: string; nodeVersion: string; platform: string;
  db: { status: 'healthy' | 'error'; pingMs: number; error: string | null; };
  memory: { heapUsedMB: number; heapTotalMB: number; rssUsedMB: number; sysTotalMB: number; sysUsedMB: number; sysFreeMB: number; heapUsedPct: number; sysUsedPct: number; };
  cpu: { count: number; model: string; };
  uptime: { seconds: number; display: string; };
}
interface LogEntry { id: string; timestamp: string; level: 'INFO' | 'WARN' | 'ERROR'; message: string; route: string; }
interface AiData {
  connected: boolean; aiEnabled: boolean; provider: string | null;
  stats: { totalGenerated: number; published: number; pendingApproval: number; failed: number; generatedThisWeek: number; };
  recentActivity: { name: string; slug: string; category: string; status: string; createdAt: string; }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <p className={`text-4xl font-black ${accent ?? 'text-[var(--text-primary)]'}`}>{value}</p>
      {sub && <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />;
}

function NoData() {
  return <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No data available</span>;
}

// ── Tab types ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'articles', label: 'Articles', icon: '✍️' },
  { id: 'ai', label: 'AI Engine', icon: '🤖' },
  { id: 'system', label: 'System', icon: '🖥️' },
  { id: 'logs', label: 'Logs', icon: '🧾' },
] as const;
type Tab = typeof TABS[number]['id'];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [system, setSystem] = useState<SystemData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [aiData, setAiData] = useState<AiData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch analytics on mount
  useEffect(() => {
    (async () => {
      setLoadingAnalytics(true);
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) throw new Error('Failed');
        setAnalytics(await res.json());
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoadingAnalytics(false); }
    })();
  }, []);

  // Lazy-load system info when tab selected
  useEffect(() => {
    if (tab === 'system' && !system) {
      setLoadingSystem(true);
      fetch('/api/admin/system').then((r) => r.json()).then(setSystem).catch(() => toast.error('Failed to load system info')).finally(() => setLoadingSystem(false));
    }
    if (tab === 'logs' && logs.length === 0) {
      setLoadingLogs(true);
      fetch('/api/admin/logs').then((r) => r.json()).then((d) => setLogs(Array.isArray(d) ? d : [])).catch(() => toast.error('Failed to load logs')).finally(() => setLoadingLogs(false));
    }
    if (tab === 'ai' && !aiData) {
      setLoadingAi(true);
      fetch('/api/admin/ai-usage').then((r) => r.json()).then(setAiData).catch(() => toast.error('Failed to load AI data')).finally(() => setLoadingAi(false));
    }
  }, [tab]);

  const refreshSystem = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/system');
      if (!res.ok) throw new Error();
      setSystem(await res.json());
    } catch { toast.error('Refresh failed'); }
    finally { setRefreshing(false); }
  };

  const ca = analytics?.calcStats;
  const aa = analytics?.articleStats;
  const hasTrends = (analytics?.trends?.length ?? 0) > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Control Panel
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Real-time metrics from the database · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/seo-finder"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-purple-600/20">
            ✍️ AI Articles
          </Link>
          <Link href="/admin/factory"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/20">
            ⚡ AI Factory
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition flex-1 justify-center ${tab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-[var(--bg-card-hover)]'}`}
            style={{ color: tab === t.id ? undefined : 'var(--text-secondary)' }}>
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border p-5 h-28 animate-pulse" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Calculator stats */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Calculators</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard label="Total Calculators" value={ca?.total ?? 0} accent="text-blue-400" sub={`${ca?.staticCount ?? 0} static · ${ca?.dynamicCount ?? 0} dynamic`} />
                  <MetricCard label="Published" value={ca?.published ?? 0} accent="text-green-400" />
                  <MetricCard label="Draft / Inactive" value={ca?.draft ?? 0} accent="text-yellow-400" />
                  <MetricCard label="Redirects" value={analytics.totalRedirects} accent="text-[var(--text-primary)]" />
                </div>
              </div>

              {/* Article stats */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Articles</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard label="Total Articles" value={aa?.total ?? 0} accent="text-purple-400" />
                  <MetricCard label="Published" value={aa?.published ?? 0} accent="text-green-400" />
                  <MetricCard label="Pending Review" value={aa?.pendingReview ?? 0} accent="text-yellow-400" />
                  <MetricCard label="Drafts" value={aa?.draft ?? 0} accent="text-gray-400" />
                </div>
              </div>

              {/* Trend chart */}
              <SectionCard
                title="Traffic Trend (last 14 days)"
                action={
                  <span className="text-[10px] px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                    From DB analytics table
                  </span>
                }
              >
                <div className="p-5">
                  {hasTrends ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={analytics.trends} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                        <defs>
                          <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gCalcs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9, fontWeight: 700 }} />
                        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }} />
                        <Area type="monotone" dataKey="views" name="Views" stroke="#3b82f6" strokeWidth={2} fill="url(#gViews)" />
                        <Area type="monotone" dataKey="calculations" name="Calculations" stroke="#a855f7" strokeWidth={2} fill="url(#gCalcs)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center flex-col gap-3">
                      <span className="text-3xl">📊</span>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No analytics data available</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Traffic trends appear here once analytics events are recorded in the database.</p>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Quick Actions */}
              <SectionCard title="Quick Actions">
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'AI Articles Manager', href: '/admin/seo-finder', icon: '✍️', color: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' },
                    { label: 'Calculator Factory', href: '/admin/factory', icon: '⚡', color: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' },
                    { label: 'SEO Audit Hub', href: '/admin/seo', icon: '🔍', color: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20' },
                    { label: 'Platform Settings', href: '/admin/settings', icon: '⚙️', color: 'bg-gray-600 hover:bg-gray-500 shadow-gray-600/20' },
                  ].map((a) => (
                    <Link key={a.href} href={a.href}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black text-white uppercase tracking-wider transition shadow-lg ${a.color}`}>
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            </>
          ) : (
            <div className="rounded-2xl border p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <NoData />
            </div>
          )}
        </div>
      )}

      {/* ── Articles Tab ──────────────────────────────────────────────────────── */}
      {tab === 'articles' && (
        <div className="space-y-5">
          {loadingAnalytics ? (
            <div className="rounded-2xl border p-12 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Total Articles" value={aa?.total ?? 0} accent="text-purple-400" />
                <MetricCard label="Published" value={aa?.published ?? 0} accent="text-green-400" sub="Live on site" />
                <MetricCard label="Pending Review" value={aa?.pendingReview ?? 0} accent="text-yellow-400" sub="Awaiting approval" />
                <MetricCard label="Drafts" value={aa?.draft ?? 0} accent="text-gray-400" sub="Not published" />
              </div>

              <SectionCard
                title="Article Workflow Status"
                action={
                  <Link href="/admin/seo-finder" className="text-xs font-bold text-blue-400 hover:underline">Manage →</Link>
                }
              >
                <div className="p-5 space-y-4">
                  {aa && aa.total > 0 ? (
                    <>
                      <div className="space-y-3">
                        {[
                          { label: 'Published', value: aa.published, color: '#22c55e' },
                          { label: 'Pending Review', value: aa.pendingReview, color: '#f59e0b' },
                          { label: 'Draft', value: aa.draft, color: '#6b7280' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex items-center gap-4">
                            <span className="text-xs font-bold w-28 shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                            <ProgressBar value={value} max={aa.total} color={color} />
                            <span className="text-xs font-black w-8 text-right shrink-0" style={{ color: 'var(--text-primary)' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] pt-2 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                        Articles always start as <strong>Draft</strong> → <strong>Pending Review</strong> → <strong>Published</strong>. Auto-publishing is disabled.
                      </p>
                    </>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <NoData />
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Generate articles using the AI Articles Manager.</p>
                      <Link href="/admin/seo-finder" className="inline-block mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl">✍️ Open AI Articles Manager</Link>
                    </div>
                  )}
                </div>
              </SectionCard>
            </>
          ) : <NoData />}
        </div>
      )}

      {/* ── AI Engine Tab ─────────────────────────────────────────────────────── */}
      {tab === 'ai' && (
        <div className="space-y-5">
          {loadingAi ? (
            <div className="rounded-2xl border p-12 flex items-center justify-center gap-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading AI data…</span>
            </div>
          ) : aiData ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Total Generated" value={aiData.stats.totalGenerated || 'No data available'} accent="text-purple-400" />
                <MetricCard label="Published" value={aiData.stats.published || 'No data available'} accent="text-green-400" />
                <MetricCard label="Pending Approval" value={aiData.stats.pendingApproval || 'No data available'} accent="text-yellow-400" />
                <MetricCard label="This Week" value={aiData.stats.generatedThisWeek || 'No data available'} accent="text-blue-400" />
              </div>

              <SectionCard title="AI Provider Status">
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <StatusDot ok={aiData.connected} />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {aiData.connected ? `Connected · ${aiData.provider ?? 'OpenRouter'}` : 'Not connected'}
                    </span>
                    {!aiData.connected && (
                      <Link href="/admin/settings" className="text-xs font-bold text-blue-400 hover:underline">Configure →</Link>
                    )}
                  </div>
                  {aiData.connected && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Keyword Research', model: 'google/gemma-4-31b-it:free' },
                        { label: 'Article Writing', model: 'nvidia/nemotron-3-ultra-550b-a55b:free' },
                      ].map(({ label, model }) => (
                        <div key={label} className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                          <code className="text-xs font-mono text-blue-400">{model}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Recent AI Activity">
                <div>
                  {aiData.recentActivity.length === 0 ? (
                    <div className="p-8 text-center"><NoData /></div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {aiData.recentActivity.map((item, i) => (
                        <div key={i} className="px-5 py-3 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/{item.slug} · {item.category}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              item.status === 'published' ? 'bg-green-500/15 text-green-400' :
                              item.status === 'pending_review' ? 'bg-yellow-500/15 text-yellow-400' :
                              'bg-gray-500/15 text-gray-400'
                            }`}>{item.status.replace('_', ' ')}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </>
          ) : <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><NoData /></div>}
        </div>
      )}

      {/* ── System Tab ────────────────────────────────────────────────────────── */}
      {tab === 'system' && (
        <div className="space-y-5">
          {loadingSystem ? (
            <div className="rounded-2xl border p-12 flex items-center justify-center gap-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading system data…</span>
            </div>
          ) : system ? (
            <>
              {/* System identity */}
              <SectionCard
                title="System Info"
                action={
                  <button onClick={refreshSystem} disabled={refreshing}
                    className="text-xs font-bold text-blue-400 hover:underline disabled:opacity-50">
                    {refreshing ? 'Refreshing…' : '↻ Refresh'}
                  </button>
                }
              >
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Environment', value: system.environment },
                    { label: 'Node.js', value: system.nodeVersion },
                    { label: 'Platform', value: system.platform },
                    { label: 'Uptime', value: system.uptime.display },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* DB status */}
              <SectionCard title="Database">
                <div className="p-5 flex items-center gap-5">
                  <StatusDot ok={system.db.status === 'healthy'} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {system.db.status === 'healthy' ? `Healthy · ${system.db.pingMs}ms ping` : `Error: ${system.db.error}`}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PostgreSQL via Drizzle ORM</p>
                  </div>
                </div>
              </SectionCard>

              {/* Memory */}
              <SectionCard title="Memory Usage">
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    {[
                      { label: 'Heap Used', used: system.memory.heapUsedMB, total: system.memory.heapTotalMB, color: system.memory.heapUsedPct > 80 ? '#ef4444' : '#3b82f6' },
                      { label: 'System RAM', used: system.memory.sysUsedMB, total: system.memory.sysTotalMB, color: system.memory.sysUsedPct > 80 ? '#ef4444' : '#22c55e' },
                    ].map(({ label, used, total, color }) => (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{used} MB / {total} MB</span>
                        </div>
                        <ProgressBar value={used} max={total} color={color} />
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t text-[10px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    CPU: {system.cpu.count} cores · {system.cpu.model} · RSS: {system.memory.rssUsedMB} MB
                  </div>
                </div>
              </SectionCard>
            </>
          ) : <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><NoData /></div>}
        </div>
      )}

      {/* ── Logs Tab ──────────────────────────────────────────────────────────── */}
      {tab === 'logs' && (
        <SectionCard
          title="System Logs"
          action={
            <button onClick={() => { setLogs([]); setLoadingLogs(true); fetch('/api/admin/logs').then((r) => r.json()).then((d) => setLogs(Array.isArray(d) ? d : [])).finally(() => setLoadingLogs(false)); }}
              className="text-xs font-bold text-blue-400 hover:underline">
              ↻ Refresh
            </button>
          }
        >
          <div>
            {loadingLogs ? (
              <div className="p-12 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center"><NoData /></div>
            ) : (
              <div className="divide-y overflow-y-auto" style={{ borderColor: 'var(--border)', maxHeight: 480 }}>
                {logs.map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-start gap-4 font-mono text-xs">
                    <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      log.level === 'ERROR' ? 'bg-red-500/15 text-red-400' :
                      log.level === 'WARN' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-blue-500/15 text-blue-400'
                    }`}>{log.level}</span>
                    <span className="shrink-0 w-36" style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="shrink-0 w-32 truncate text-purple-400">{log.route}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
