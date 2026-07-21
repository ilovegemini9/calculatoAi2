'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalcStats {
  total: number; staticCount: number; dynamicCount: number;
  published: number; draft: number; disabled: number;
}
interface ArticleStats {
  total: number; published: number; draft: number; pendingReview: number; scheduled: number;
}
interface TrendPoint { date: string; views: number; calculations: number; }
interface AnalyticsData {
  totalDynamic: number; totalArticles: number; totalRedirects: number;
  calcStats: CalcStats; articleStats: ArticleStats; trends: TrendPoint[];
  settings: { adsenseEnabled: boolean; adsenseCode: string; analyticsCode: string; };
}
interface LogEntry {
  id: string; timestamp: string; level: 'INFO' | 'WARN' | 'ERROR'; message: string; route: string;
}
interface BackupEntry {
  id: string; date: string; size: string; status: 'Completed' | 'Pending'; type: string;
}
interface SystemData {
  serverTime: string; environment: string; nodeVersion: string; platform: string;
  db: { status: 'healthy' | 'error'; pingMs: number; error: string | null; };
  memory: { heapUsedMB: number; heapTotalMB: number; rssUsedMB: number; sysTotalMB: number; sysUsedMB: number; sysFreeMB: number; heapUsedPct: number; sysUsedPct: number; };
  cpu: { count: number; model: string; };
  uptime: { seconds: number; display: string; };
}
interface AiData {
  connected: boolean; aiEnabled: boolean; provider: string | null;
  stats: { totalGenerated: number; published: number; pendingApproval: number; failed: number; generatedThisWeek: number; };
  tokenUsage: null;
  recentActivity: { name: string; slug: string; category: string; status: string; createdAt: string; }[];
}

// ── Stat card helper ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <p className={`text-4xl font-extrabold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-[10px] mt-2 font-semibold" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function EmptyState({ icon, title, description, href, cta }: {
  icon: string; title: string; description: string; href?: string; cta?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>
      {href && cta && (
        <Link href={href} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition">
          {cta}
        </Link>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: '📊 Overview' },
  { id: 'ai',        label: '🤖 AI Engine' },
  { id: 'system',    label: '🖥️ System' },
  { id: 'logs',      label: '🧾 Logs' },
  { id: 'adsense',   label: '💵 Ads' },
  { id: 'gsc',       label: '🔍 GSC' },
] as const;
type Tab = typeof TABS[number]['id'];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Overview
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // AI Engine
  const [aiData, setAiData]   = useState<AiData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // System
  const [sys, setSys]         = useState<SystemData | null>(null);
  const [sysLoading, setSysLoading] = useState(false);

  // Logs
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLevel, setLogLevel] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  // Initial overview fetch
  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d); setDataLoading(false); })
      .catch(() => { toast.error('Failed to load dashboard analytics.'); setDataLoading(false); });
  }, []);

  // Lazy tab fetches
  useEffect(() => {
    if (activeTab === 'ai' && !aiData && !aiLoading) {
      setAiLoading(true);
      fetch('/api/admin/ai-usage')
        .then((r) => r.json())
        .then((d) => { setAiData(d); setAiLoading(false); })
        .catch(() => { toast.error('Failed to load AI usage data.'); setAiLoading(false); });
    }
    if (activeTab === 'system' && !sys && !sysLoading) {
      setSysLoading(true);
      fetch('/api/admin/system')
        .then((r) => r.json())
        .then((d) => { setSys(d); setSysLoading(false); })
        .catch(() => { toast.error('Failed to load system health data.'); setSysLoading(false); });
    }
    if (activeTab === 'logs') {
      setLogsLoading(true);
      setBackupsLoading(true);
      const params = new URLSearchParams();
      if (logLevel !== 'ALL') params.set('level', logLevel);
      if (logSearch) params.set('search', logSearch);
      fetch(`/api/admin/logs?${params}`)
        .then((r) => r.json())
        .then((d) => { setLogs(d); setLogsLoading(false); })
        .catch(() => { toast.error('Failed to load logs.'); setLogsLoading(false); });
      fetch('/api/admin/backups')
        .then((r) => r.json())
        .then((d) => { setBackups(d); setBackupsLoading(false); })
        .catch(() => { toast.error('Failed to load backups.'); setBackupsLoading(false); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, logLevel, logSearch]);

  const handleClearLogs = async () => {
    const res = await fetch('/api/admin/logs', { method: 'DELETE' });
    if (res.ok) { setLogs([]); toast.success('System logs cleared.'); }
    else toast.error('Failed to clear logs.');
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backups', { method: 'POST' });
      if (res.ok) {
        const backup = await res.json();
        setBackups([backup, ...backups]);
        toast.success('Database snapshot saved.');
      } else toast.error('Failed to create backup.');
    } catch { toast.error('An error occurred creating the backup.'); }
    finally { setCreatingBackup(false); }
  };

  const refreshSystem = () => {
    setSys(null);
    setSysLoading(true);
    fetch('/api/admin/system')
      .then((r) => r.json())
      .then((d) => { setSys(d); setSysLoading(false); })
      .catch(() => { toast.error('Failed to refresh system health.'); setSysLoading(false); });
  };

  // Loading skeleton
  if (dataLoading || !data) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading console data…
      </div>
    );
  }

  const { calcStats, articleStats, trends, settings } = data;

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Enterprise Console
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Real-time platform metrics sourced from live database tables and system APIs.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 self-start">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--bg-card)] border text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
              }`}
              style={activeTab !== tab.id ? { borderColor: 'var(--border)' } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">

          {/* Calculator stats */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Calculators — queried from calculators table
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total"     value={calcStats.total}     color="text-blue-500"   sub={`${calcStats.staticCount} static + ${data.totalDynamic} dynamic`} />
              <StatCard label="Published" value={calcStats.published} color="text-green-500"  sub="Live & indexed by search engines" />
              <StatCard label="Draft"     value={calcStats.draft}     color="text-yellow-500" sub="Pending activation" />
              <StatCard label="Disabled"  value={calcStats.disabled}  color="text-red-500"    sub="Removed from public routing" />
            </div>
          </div>

          {/* Article stats */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Articles — queried from articles table
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Published"     value={articleStats.published}     color="text-green-500"  />
              <StatCard label="Draft"         value={articleStats.draft}         color="text-yellow-500" />
              <StatCard label="Pending Review" value={articleStats.pendingReview} color="text-orange-500" />
              <StatCard label="Scheduled"     value={articleStats.scheduled}     color="text-blue-500"   />
            </div>
          </div>

          {/* Analytics — connection check */}
          <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4">Traffic & Usage Analytics</h2>
            {settings.analyticsCode ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Analytics script configured.{' '}
                Real-time users, sessions, and page views are collected via the embedded provider script.
              </p>
            ) : (
              <EmptyState
                icon="📡"
                title="Analytics provider not connected"
                description="Connect a GA4 or compatible analytics provider to stream real Users, Sessions, Page Views, and Top Calculators here."
                href="/admin/settings"
                cta="Connect Analytics →"
              />
            )}
          </div>

          {/* Historical chart — real analytics records or empty state */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              Historical Traffic & Calculations
            </h2>
            {trends.length === 0 ? (
              <EmptyState
                icon="📉"
                title="No historical data available"
                description="Charts render automatically as traffic accumulates in the analytics table via POST /api/analytics/hit."
              />
            ) : (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="colorCalcs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date"  stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis              stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="views"        name="Page Views"    stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="calculations" name="Calculations"  stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCalcs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: AI ENGINE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {aiLoading || !aiData ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Querying AI engine stats…
            </div>
          ) : !aiData.connected || !aiData.aiEnabled ? (
            <div className="rounded-2xl border p-10 flex flex-col items-center gap-4 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-5xl">🤖</span>
              <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                {!aiData.aiEnabled ? 'AI features are disabled' : 'AI provider not connected'}
              </p>
              <p className="text-xs max-w-md" style={{ color: 'var(--text-muted)' }}>
                {!aiData.aiEnabled
                  ? 'Enable AI features in Platform Settings to activate the Calculator Factory engine.'
                  : 'Add an OpenRouter API key or set GEMINI_API_KEY to connect the AI generation engine.'}
              </p>
              <Link href="/admin/settings" className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-blue-600/20">
                Configure in Settings →
              </Link>
            </div>
          ) : (
            <>
              {/* Provider banner */}
              <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                <div>
                  <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                    AI Engine Online — Provider: {aiData.provider}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    AI features enabled · Calculator Factory active
                  </p>
                </div>
              </div>

              {/* Stats from DB */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Factory stats — queried from calculators table
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <StatCard label="Total Generated"   value={aiData.stats.totalGenerated}   color="text-blue-500"   />
                  <StatCard label="Published"          value={aiData.stats.published}         color="text-green-500"  />
                  <StatCard label="Pending Approval"   value={aiData.stats.pendingApproval}   color="text-yellow-500" />
                  <StatCard label="Factory Errors"     value={aiData.stats.failed}            color="text-red-500"    />
                  <StatCard label="Generated This Week" value={aiData.stats.generatedThisWeek} color="text-purple-500" />
                </div>
              </div>

              {/* Token usage — empty state (no DB tracking) */}
              <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4">Token Usage & Budget</h2>
                <EmptyState
                  icon="🪙"
                  title="Token usage not tracked server-side"
                  description="Tokens used, daily budget, and response times are available in your OpenRouter or Google AI Studio dashboard. The Calculator Factory does not log token counts locally."
                />
                {aiData.provider === 'OpenRouter' && (
                  <div className="flex justify-center mt-2">
                    <a href="https://openrouter.ai/activity" target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition">
                      View OpenRouter Usage Dashboard →
                    </a>
                  </div>
                )}
              </div>

              {/* Recent activity from DB */}
              <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">Recent AI-Generated Calculators</h2>
                {aiData.recentActivity.length === 0 ? (
                  <EmptyState icon="⚡" title="No calculators generated yet" description="Use the AI Calculator Factory to generate your first dynamic calculator." href="/admin/factory" cta="Open Factory →" />
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {aiData.recentActivity.map((c) => (
                      <div key={c.slug} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                          <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>/{c.slug}-calculator · {c.category}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            c.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {c.status === 'active' ? 'Live' : 'Draft'}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: SYSTEM HEALTH
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Live system metrics from Node.js runtime
            </h2>
            <button
              onClick={refreshSystem}
              disabled={sysLoading}
              className="px-3 py-1.5 border text-xs font-bold rounded-lg hover:bg-[var(--bg-card-hover)] transition disabled:opacity-50"
              style={{ borderColor: 'var(--border)' }}
            >
              {sysLoading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>

          {sysLoading || !sys ? (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Reading system runtime metrics…
            </div>
          ) : (
            <>
              {/* Status row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* DB status */}
                <div className="rounded-2xl border p-5 space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Database</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${sys.db.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className={`text-xl font-extrabold ${sys.db.status === 'healthy' ? 'text-green-500' : 'text-red-500'}`}>
                      {sys.db.status === 'healthy' ? 'Healthy' : 'Error'}
                    </p>
                  </div>
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {sys.db.status === 'healthy' ? `Ping: ${sys.db.pingMs}ms` : sys.db.error ?? 'Connection failed'}
                  </p>
                </div>

                {/* Uptime */}
                <div className="rounded-2xl border p-5 space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Uptime</span>
                  <p className="text-xl font-extrabold mt-1 text-blue-500">{sys.uptime.display}</p>
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Process uptime</p>
                </div>

                {/* Environment */}
                <div className="rounded-2xl border p-5 space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Environment</span>
                  <p className="text-xl font-extrabold mt-1 text-purple-500 capitalize">{sys.environment}</p>
                  <p className="text-[10px] font-semibold font-mono" style={{ color: 'var(--text-muted)' }}>Node {sys.nodeVersion}</p>
                </div>

                {/* Server time */}
                <div className="rounded-2xl border p-5 space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Server Time (UTC)</span>
                  <p className="text-sm font-extrabold mt-1 text-orange-500 font-mono">
                    {new Date(sys.serverTime).toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })}
                  </p>
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {new Date(sys.serverTime).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </p>
                </div>
              </div>

              {/* Memory */}
              <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">Memory Usage</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Heap */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>Process Heap</span>
                      <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{sys.memory.heapUsedMB} / {sys.memory.heapTotalMB} MB</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                      <div
                        className={`h-full rounded-full transition-all ${sys.memory.heapUsedPct > 80 ? 'bg-red-500' : sys.memory.heapUsedPct > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ width: `${sys.memory.heapUsedPct}%` }}
                      />
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sys.memory.heapUsedPct}% used · RSS {sys.memory.rssUsedMB} MB</p>
                  </div>

                  {/* System RAM */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>System RAM</span>
                      <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{sys.memory.sysUsedMB} / {sys.memory.sysTotalMB} MB</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                      <div
                        className={`h-full rounded-full transition-all ${sys.memory.sysUsedPct > 85 ? 'bg-red-500' : sys.memory.sysUsedPct > 65 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${sys.memory.sysUsedPct}%` }}
                      />
                    </div>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sys.memory.sysUsedPct}% used · {sys.memory.sysFreeMB} MB free</p>
                  </div>
                </div>
              </div>

              {/* CPU */}
              <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4">CPU</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Logical Cores</p>
                    <p className="text-2xl font-extrabold text-blue-500">{sys.cpu.count}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Model</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{sys.cpu.model}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      Real-time CPU % requires OS-level sampling. Use host monitoring tools for per-core load.
                    </p>
                  </div>
                </div>
              </div>

              {/* Queue — no queue worker in current architecture */}
              <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4">Queue Worker</h2>
                <EmptyState
                  icon="📋"
                  title="No background queue configured"
                  description="The platform currently processes AI generation requests synchronously. A Redis-backed queue (BullMQ) would enable pending/running/failed/retry tracking. Pending/Running/Completed/Failed counts will appear here once a queue worker is connected."
                />
              </div>

              {/* Disk — no Node API */}
              <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4">Disk Storage</h2>
                <EmptyState
                  icon="💾"
                  title="Disk metrics require OS-level access"
                  description="Node.js does not expose disk usage natively. Use df -h on the server or connect a monitoring integration (Datadog, New Relic) to surface storage metrics here."
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: LOGS & BACKUPS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logs panel */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>🧾 Error & Trace Logs</h2>
              <button onClick={handleClearLogs} className="text-xs text-red-500 hover:underline font-bold">Clear all</button>
            </div>
            <div className="flex gap-2">
              <input
                type="text" placeholder="Search logs…" value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="flex-1 p-2 border rounded-lg outline-none text-xs"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <select
                value={logLevel} onChange={(e) => setLogLevel(e.target.value)}
                className="p-2 border rounded-lg outline-none text-xs cursor-pointer"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="ALL">All levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {logsLoading ? (
                <p className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading logs…</p>
              ) : logs.length === 0 ? (
                <EmptyState icon="📋" title="No log entries recorded" description="Logs appear here when the system records events. Errors and warnings are captured automatically." />
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-xl" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        log.level === 'ERROR' ? 'bg-red-500/15 text-red-500' :
                        log.level === 'WARN'  ? 'bg-yellow-500/15 text-yellow-500' : 'bg-blue-500/15 text-blue-500'
                      }`}>{log.level}</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{log.timestamp}</span>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{log.message}</p>
                    <p className="text-[10px] font-mono text-blue-500 mt-1">{log.route}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Backups panel */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>🗄️ Snapshot History</h2>
              <button
                onClick={handleCreateBackup} disabled={creatingBackup}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] uppercase font-bold tracking-wider rounded-lg transition"
              >
                {creatingBackup ? 'Saving…' : 'Backup now'}
              </button>
            </div>
            <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              {backupsLoading ? (
                <p className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading snapshots…</p>
              ) : backups.length === 0 ? (
                <EmptyState icon="🗄️" title="No snapshots yet" description='Click "Backup now" to create your first database snapshot.' />
              ) : (
                backups.map((bk) => (
                  <div key={bk.id} className="py-3.5 flex items-center justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{bk.type}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Size: {bk.size} · {bk.date}</p>
                    </div>
                    <span className="text-[10px] font-bold text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded">{bk.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ADS MANAGER
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'adsense' && (
        <div className="space-y-6">
          {settings.adsenseEnabled && settings.adsenseCode ? (
            <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>AdSense Connected</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Publisher script configured.
              </p>
              <EmptyState
                icon="📊"
                title="Revenue metrics require AdSense Management API"
                description="Estimated Earnings, RPM, CTR, and Impressions must be fetched via Google's OAuth2 AdSense API using a service account — not available without a connected OAuth credential. View live data directly in Google AdSense."
              />
              <div className="flex justify-center mt-2">
                <a href="https://www.google.com/adsense" target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition">
                  Open AdSense Dashboard →
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border p-10 flex flex-col items-center gap-4 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-5xl">💵</span>
              <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>AdSense not connected</p>
              <p className="text-xs max-w-md" style={{ color: 'var(--text-muted)' }}>
                No AdSense publisher script is configured. Earnings, RPM, CTR, and impression data require a live AdSense connection.
              </p>
              <Link href="/admin/settings" className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-blue-600/20">
                Configure AdSense in Settings →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: GOOGLE SEARCH CONSOLE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'gsc' && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-10 flex flex-col items-center gap-4 text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="text-5xl">🔍</span>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Google Search Console is not connected</p>
            <p className="text-xs max-w-md" style={{ color: 'var(--text-muted)' }}>
              Connect the GSC Search Analytics API to fetch real Clicks, Impressions, CTR, and Average Position data.
              Requires a verified property and a service account with read access.
            </p>
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer"
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-blue-600/20">
              Connect GSC API →
            </a>
          </div>
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Site Verification</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Configure Google and Bing verification tokens in{' '}
              <Link href="/admin/settings" className="text-blue-500 hover:underline font-bold">Settings</Link>.
              They are injected automatically into the HTML head once saved.
            </p>
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
              <span className="text-xl">ℹ️</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Verification keys are stored in Settings and never displayed in plain text here for security.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
