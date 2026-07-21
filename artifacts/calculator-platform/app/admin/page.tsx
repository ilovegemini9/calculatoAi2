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
import { CALCULATORS } from '@/config/calculators';

interface CalcStats {
  total: number;
  staticCount: number;
  published: number;
  draft: number;
  disabled: number;
}

interface ArticleStats {
  total: number;
  published: number;
  draft: number;
  pendingReview: number;
  scheduled: number;
}

interface TrendPoint {
  date: string;
  views: number;
  calculations: number;
}

interface AnalyticsData {
  totalDynamic: number;
  totalArticles: number;
  totalRedirects: number;
  calcStats: CalcStats;
  articleStats: ArticleStats;
  trends: TrendPoint[];
  settings: {
    adsenseEnabled: boolean;
    adsenseCode: string;
    analyticsCode: string;
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  route: string;
}

interface BackupEntry {
  id: string;
  date: string;
  size: string;
  status: 'Completed' | 'Pending';
  type: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'adsense' | 'logs' | 'verification'>('insights');

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logLevel, setLogLevel] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Backups state
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  // Fetch main analytics
  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to retrieve dashboard analytics.');
        setLoading(false);
      });
  }, []);

  // Fetch logs when logs tab is active
  useEffect(() => {
    if (activeTab !== 'logs') return;
    setLogsLoading(true);
    const params = new URLSearchParams();
    if (logLevel !== 'ALL') params.set('level', logLevel);
    if (logSearch) params.set('search', logSearch);
    fetch(`/api/admin/logs?${params}`)
      .then((res) => res.json())
      .then((d) => { setLogs(d); setLogsLoading(false); })
      .catch(() => { toast.error('Failed to load logs.'); setLogsLoading(false); });
  }, [activeTab, logLevel, logSearch]);

  // Fetch backups when logs tab is active
  useEffect(() => {
    if (activeTab !== 'logs') return;
    setBackupsLoading(true);
    fetch('/api/admin/backups')
      .then((res) => res.json())
      .then((d) => { setBackups(d); setBackupsLoading(false); })
      .catch(() => { toast.error('Failed to load backups.'); setBackupsLoading(false); });
  }, [activeTab]);

  const handleClearLogs = async () => {
    const res = await fetch('/api/admin/logs', { method: 'DELETE' });
    if (res.ok) {
      setLogs([]);
      toast.success('System logs cleared.');
    } else {
      toast.error('Failed to clear logs.');
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch('/api/admin/backups', { method: 'POST' });
      if (res.ok) {
        const backup = await res.json();
        setBackups([backup, ...backups]);
        toast.success('Database snapshot saved successfully.');
      } else {
        toast.error('Failed to create backup.');
      }
    } catch {
      toast.error('An error occurred creating the backup.');
    } finally {
      setCreatingBackup(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading console analytics...
      </div>
    );
  }

  const { calcStats, articleStats, trends, settings } = data;
  const totalCalculatorsCount = CALCULATORS.length + data.totalDynamic;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Enterprise Console Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Monitor real-time platform metrics, system logs, and external integrations.
          </p>
        </div>

        <div className="flex border rounded-xl overflow-hidden self-start" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'insights', label: '📊 Insights' },
            { id: 'adsense', label: '💵 Ads Manager' },
            { id: 'logs', label: '🧾 System Logs' },
            { id: 'verification', label: '🔍 GSC Search' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2 text-xs font-bold border-r last:border-0 transition duration-150 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
              }`}
              style={{ borderColor: 'var(--border)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Insights Tab ─────────────────────────────────────── */}
      {activeTab === 'insights' && (
        <div className="space-y-8">

          {/* Calculator stats */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Calculators
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: calcStats.total, sub: `${calcStats.staticCount} Static + ${data.totalDynamic} Dynamic`, color: 'text-blue-500' },
                { label: 'Published', value: calcStats.published, sub: 'Live & indexed', color: 'text-green-500' },
                { label: 'Draft', value: calcStats.draft, sub: 'Awaiting activation', color: 'text-yellow-500' },
                { label: 'Disabled', value: calcStats.disabled, sub: 'Offline from public', color: 'text-red-500' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                  <p className={`text-4xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] mt-2 font-semibold" style={{ color: 'var(--text-muted)' }}>{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Article stats */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Articles
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Published', value: articleStats.published, color: 'text-green-500' },
                { label: 'Draft', value: articleStats.draft, color: 'text-yellow-500' },
                { label: 'Pending Review', value: articleStats.pendingReview, color: 'text-orange-500' },
                { label: 'Scheduled', value: articleStats.scheduled, color: 'text-blue-500' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                  <p className={`text-4xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics empty state — GA4 not connected */}
          <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4">
              Traffic & Usage Analytics
            </h2>
            {settings.analyticsCode ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Analytics configured with code <span className="font-mono">{settings.analyticsCode}</span>. 
                Real-time data is collected via the embedded script.
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <span className="text-4xl">📡</span>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Analytics provider not connected</p>
                <p className="text-xs text-center max-w-sm" style={{ color: 'var(--text-muted)' }}>
                  Connect a GA4 or compatible analytics provider to stream real Users, Sessions,
                  Page Views, and Top Calculators here.
                </p>
                <a
                  href="/admin/settings"
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition"
                >
                  Connect Analytics →
                </a>
              </div>
            )}
          </div>

          {/* Chart — real data from db.analytics, or empty state */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              Historical Traffic & Calculations
            </h2>
            {trends.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-2">
                <span className="text-4xl">📉</span>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No historical data available</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Charts will render automatically as traffic data accumulates in the analytics table.
                </p>
              </div>
            ) : (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCalcs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                        borderRadius: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="views" name="Page Views" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" dataKey="calculations" name="Calculations" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCalcs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AdSense Tab ───────────────────────────────────────── */}
      {activeTab === 'adsense' && (
        <div className="space-y-6">
          {settings.adsenseEnabled && settings.adsenseCode ? (
            <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>AdSense Connected</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Publisher ID: <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{settings.adsenseCode}</span>
              </p>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Revenue metrics (Estimated Earnings, RPM, CTR, Impressions) must be viewed directly in the{' '}
                <a href="https://www.google.com/adsense" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-bold">
                  Google AdSense Dashboard →
                </a>
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                The AdSense Management API requires OAuth2 authorization and cannot be displayed here without a connected service account.
                <a href="/admin/settings" className="ml-1 text-blue-500 hover:underline font-bold">Configure in Settings →</a>
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border p-10 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-5xl">💵</span>
              <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>AdSense not connected</p>
              <p className="text-xs text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
                No AdSense publisher ID is configured. Earnings, RPM, CTR, and impression data require a live AdSense connection.
                Enable AdSense and enter your publisher ID in Settings to activate monetization tracking.
              </p>
              <a
                href="/admin/settings"
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                Configure AdSense in Settings →
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── System Logs & Backups Tab ─────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logs panel */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>🧾 Error & Trace Logs</h2>
              <button onClick={handleClearLogs} className="text-xs text-red-500 hover:underline font-bold">
                Clear all
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="flex-1 p-2 border rounded-lg outline-none text-xs"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
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
                <p className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading logs...</p>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No error logs recorded</p>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Logs appear here when the system records events. Enable verbose logging in Settings to capture trace events.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-xl" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        log.level === 'ERROR' ? 'bg-red-500/15 text-red-500' :
                        log.level === 'WARN' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-blue-500/15 text-blue-500'
                      }`}>
                        {log.level}
                      </span>
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
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] uppercase font-bold tracking-wider rounded-lg transition"
              >
                {creatingBackup ? 'Saving...' : 'Backup now'}
              </button>
            </div>

            <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              {backupsLoading ? (
                <p className="text-xs text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading snapshots...</p>
              ) : backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <span className="text-3xl">🗄️</span>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No snapshots yet</p>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Click "Backup now" to create your first database snapshot.
                  </p>
                </div>
              ) : (
                backups.map((bk) => (
                  <div key={bk.id} className="py-3.5 flex items-center justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{bk.type}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Size: {bk.size} | {bk.date}</p>
                    </div>
                    <span className="text-[10px] font-bold text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded">
                      {bk.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Google Search Console Tab ─────────────────────────── */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* GSC empty state */}
          <div className="rounded-2xl border p-10 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <span className="text-5xl">🔍</span>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Google Search Console is not connected</p>
            <p className="text-xs text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
              Connect the GSC API to fetch real Clicks, Impressions, CTR, and Average Position data.
              Requires a verified property and a service account with read access.
            </p>
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-blue-600/20"
            >
              Connect GSC API →
            </a>
          </div>

          {/* Site Verification Tokens — from settings */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Site Verification Meta Tags
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Configure your Google and Bing verification tokens in{' '}
              <a href="/admin/settings" className="text-blue-500 hover:underline font-bold">Settings</a>.
              They are injected automatically into the HTML head once saved.
            </p>
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
              <span className="text-xl">ℹ️</span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Verification keys are stored in Settings and never displayed in plain text here for security.
                Add or update them under <a href="/admin/settings" className="text-blue-500 hover:underline font-bold">Admin → Settings</a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
