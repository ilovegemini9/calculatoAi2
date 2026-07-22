import os from 'os';
import {
  Calculator,
  FileText,
  Users,
  Activity,
  AlertTriangle,
  BookOpen,
  Server,
  Database,
  Cpu,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { getDb } from '@/lib/db';
import { CALCULATORS } from '@/config/calculators';
import { StatCard, ContentCard } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/EmptyState';
import { TrafficChart } from '@/components/admin/dashboard/TrafficChart';
import { TopCalculatorsChart } from '@/components/admin/dashboard/TopCalculatorsChart';
import type { LogEntry, Article } from '@/lib/types';

export const metadata = { title: 'Dashboard — Admin' };
// Always fresh — never cache the admin dashboard
export const dynamic = 'force-dynamic';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const LOG_LEVEL_STYLE: Record<string, string> = {
  ERROR: 'bg-red-500/10 text-red-500 border-red-500/20',
  WARN:  'bg-amber-500/10 text-amber-500 border-amber-500/20',
  INFO:  'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  // ── Read DB ───────────────────────────────────────────────────────────────
  const db = getDb();

  // ── Calculator stats ──────────────────────────────────────────────────────
  const staticCalcCount   = CALCULATORS.length;
  const dynamicActive     = db.calculators.filter((c) => c.status === 'active').length;
  const totalActiveCalcs  = staticCalcCount + dynamicActive;

  // ── Article stats ─────────────────────────────────────────────────────────
  const publishedArticles = db.articles.filter((a) => a.status === 'published');
  const draftArticles     = db.articles.filter(
    (a) => a.status === 'draft' || a.status === 'pending_review',
  );

  // ── User count ────────────────────────────────────────────────────────────
  const userCount = db.adminUsers.length;

  // ── Total page views ──────────────────────────────────────────────────────
  const totalViews = db.analytics.reduce((sum, a) => sum + a.views, 0);

  // ── Traffic trend (last 14 days, aggregated by date) ─────────────────────
  const byDate: Record<string, number> = {};
  for (const entry of db.analytics) {
    byDate[entry.date] = (byDate[entry.date] ?? 0) + entry.views;
  }
  const trafficTrend = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, views]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views,
    }));

  // ── Most used calculators (top 5 by views) ────────────────────────────────
  // Build a name lookup: slug/id → display name
  const calcNameById: Record<string, string> = {};
  for (const c of CALCULATORS) calcNameById[c.slug] = c.shortName ?? c.name;
  for (const c of db.calculators) calcNameById[c.id] = c.name;
  for (const c of db.calculators) calcNameById[c.slug] = c.name;

  const viewsByCalc: Record<string, number> = {};
  for (const entry of db.analytics) {
    viewsByCalc[entry.calculatorId] =
      (viewsByCalc[entry.calculatorId] ?? 0) + entry.views;
  }
  const topCalculators = Object.entries(viewsByCalc)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, views]) => ({
      name: calcNameById[id] ?? id,
      views,
    }));

  // ── Recent activity (all logs, last 8, newest first) ─────────────────────
  const recentActivity: LogEntry[] = [...db.logs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  // ── Latest errors (ERROR level, last 5) ───────────────────────────────────
  const latestErrors: LogEntry[] = [...db.logs]
    .filter((l) => l.level === 'ERROR')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // ── Recent publications (published articles, last 5) ──────────────────────
  const recentPublications: Article[] = [...publishedArticles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // ── System status ─────────────────────────────────────────────────────────
  let dbPingMs = 0;
  let dbHealthy = true;
  try {
    const t0 = Date.now();
    getDb();
    dbPingMs = Date.now() - t0;
  } catch {
    dbHealthy = false;
  }

  const mem         = process.memoryUsage();
  const heapUsedMB  = Math.round(mem.heapUsed  / 1024 / 1024);
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
  const heapPct     = heapTotalMB > 0 ? Math.round((heapUsedMB / heapTotalMB) * 100) : 0;
  const sysTotalMB  = Math.round(os.totalmem() / 1024 / 1024);
  const sysFreeMB   = Math.round(os.freemem()  / 1024 / 1024);
  const sysUsedPct  = sysTotalMB > 0 ? Math.round(((sysTotalMB - sysFreeMB) / sysTotalMB) * 100) : 0;
  const uptimeDisplay = formatUptime(process.uptime());

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Live overview of platform data.
        </p>
      </div>

      {/* ── Top stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active Calculators"
          value={totalActiveCalcs}
          icon={<Calculator className="w-4 h-4" />}
        />
        <StatCard
          label="Published Articles"
          value={publishedArticles.length > 0 ? publishedArticles.length : undefined}
          icon={<FileText className="w-4 h-4" />}
        />
        <StatCard
          label="Draft Articles"
          value={draftArticles.length > 0 ? draftArticles.length : undefined}
          icon={<BookOpen className="w-4 h-4" />}
        />
        <StatCard
          label="Admin Users"
          value={userCount}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label="Total Page Views"
          value={totalViews > 0 ? totalViews.toLocaleString() : undefined}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* ── Traffic Overview + Most Used Calculators ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ContentCard
          title="Traffic Overview"
          description="Page views — last 14 days"
        >
          <TrafficChart data={trafficTrend} />
        </ContentCard>

        <ContentCard
          title="Most Used Calculators"
          description="Ranked by total page views"
        >
          <TopCalculatorsChart data={topCalculators} />
        </ContentCard>

      </div>

      {/* ── Recent Activity + Latest Errors ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity */}
        <ContentCard
          title="Recent Activity"
          description="Last 8 system log entries"
          action={
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Activity className="w-3.5 h-3.5" />
              Live
            </span>
          }
        >
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-5 h-5" />}
              title="No activity recorded"
              description="System events will appear here as they occur."
            />
          ) : (
            <ul className="space-y-2">
              {recentActivity.map((log) => (
                <li key={log.id} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span
                    className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      LOG_LEVEL_STYLE[log.level] ?? 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    {log.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-primary)] truncate">{log.message}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {log.route && <span className="font-mono mr-2">{log.route}</span>}
                      {formatRelativeTime(log.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>

        {/* Latest Errors */}
        <ContentCard
          title="Latest Errors"
          description="Most recent ERROR-level log entries"
          action={
            latestErrors.length > 0 ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                {latestErrors.length} error{latestErrors.length !== 1 ? 's' : ''}
              </span>
            ) : undefined
          }
        >
          {latestErrors.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="w-5 h-5" />}
              title="No errors recorded"
              description="Error-level log entries will appear here."
            />
          ) : (
            <ul className="space-y-2">
              {latestErrors.map((log) => (
                <li key={log.id} className="p-3 rounded-lg border bg-red-500/5 border-red-500/20 space-y-1">
                  <p className="text-xs font-medium text-[var(--text-primary)]">{log.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    {log.route && <span className="font-mono">{log.route}</span>}
                    <span>·</span>
                    <span>{formatRelativeTime(log.timestamp)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>

      </div>

      {/* ── Recent Publications ──────────────────────────────────────────────── */}
      <ContentCard
        title="Recent Publications"
        description="Latest published articles"
      >
        {recentPublications.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-5 h-5" />}
            title="No published articles"
            description="Articles will appear here once they are published."
          />
        ) : (
          <ul className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {recentPublications.map((article) => (
              <li key={article.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {article.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                    /{article.slug}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Published
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {formatRelativeTime(article.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ContentCard>

      {/* ── System Status ────────────────────────────────────────────────────── */}
      <ContentCard title="System Status" description="Runtime and infrastructure health">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {/* Database */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" />
              Database
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dbHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {dbHealthy ? 'Healthy' : 'Error'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Ping: {dbPingMs}ms
            </p>
          </div>

          {/* Memory */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <Server className="w-3.5 h-3.5" />
              Memory
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {heapUsedMB} / {heapTotalMB} MB
            </p>
            <div className="w-full h-1.5 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${heapPct > 80 ? 'bg-red-500' : heapPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${heapPct}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">Heap {heapPct}% used</p>
          </div>

          {/* System RAM */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              System RAM
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {sysTotalMB - sysFreeMB} / {sysTotalMB} MB
            </p>
            <div className="w-full h-1.5 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${sysUsedPct > 85 ? 'bg-red-500' : sysUsedPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${sysUsedPct}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">{sysUsedPct}% used</p>
          </div>

          {/* Uptime */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              Uptime
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{uptimeDisplay}</p>
            <p className="text-xs text-[var(--text-muted)]">
              Node {process.version}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {process.env.NODE_ENV ?? 'development'}
            </p>
          </div>

        </div>
      </ContentCard>

    </div>
  );
}
