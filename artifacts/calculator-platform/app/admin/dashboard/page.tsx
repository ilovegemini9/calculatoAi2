import { Activity, BarChart3, Code2, ExternalLink, FileText, Gauge, Megaphone, Settings2, TrendingUp, Users } from 'lucide-react';
import { getDb } from '@/lib/db';
import { CALCULATORS } from '@/config/calculators';
import { StatCard, ContentCard } from '@/components/admin/Card';
import { TrafficChart } from '@/components/admin/dashboard/TrafficChart';
import { TopCalculatorsChart } from '@/components/admin/dashboard/TopCalculatorsChart';

export const metadata = { title: 'Dashboard — Admin' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const db = await getDb();

  const totalViews = db.analytics.reduce((sum, item) => sum + item.views, 0);
  const activeDynamic = db.calculators.filter((item) => item.status === 'active').length;
  const activeCalculators = CALCULATORS.length + activeDynamic;
  const publishedArticles = db.articles.filter((item) => item.status === 'published').length;
  const adminUsers = db.adminUsers.length;

  const byDate: Record<string, number> = {};
  for (const item of db.analytics) byDate[item.date] = (byDate[item.date] ?? 0) + item.views;
  const traffic = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, views]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views,
    }));

  const names: Record<string, string> = {};
  for (const item of CALCULATORS) names[item.slug] = item.shortName ?? item.name;
  for (const item of db.calculators) {
    names[item.id] = item.name;
    names[item.slug] = item.name;
  }
  const byCalculator: Record<string, number> = {};
  for (const item of db.analytics) {
    if (item.calculatorId) byCalculator[item.calculatorId] = (byCalculator[item.calculatorId] ?? 0) + item.views;
  }
  const topCalculators = Object.entries(byCalculator)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, views]) => ({ name: names[id] ?? id, views }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Admin overview</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Analytics first. Configuration stays in its own section.</p>
        </div>
        <a href="/admin/analytics" className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]" style={{ borderColor: 'var(--border)' }}>
          <BarChart3 className="h-4 w-4" /> Open full Analytics <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Page Views" value={totalViews.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Active Calculators" value={activeCalculators} icon={<Gauge className="h-4 w-4" />} />
        <StatCard label="Published Articles" value={publishedArticles} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Admin Users" value={adminUsers} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ContentCard title="Traffic overview" description="Last 14 days">
          <TrafficChart data={traffic} />
        </ContentCard>
        <ContentCard title="Top calculators" description="Ranked by page views">
          <TopCalculatorsChart data={topCalculators} />
        </ContentCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <a href="/admin/analytics" className="group rounded-xl border p-5 transition hover:bg-[var(--bg-card-hover)]" style={{ borderColor: 'var(--border)' }}>
          <BarChart3 className="h-5 w-5 text-[var(--text-muted)]" />
          <h2 className="mt-4 font-semibold text-[var(--text-primary)]">Analytics</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Traffic, calculator performance and trends.</p>
        </a>
        <a href="/admin/ads" className="group rounded-xl border p-5 transition hover:bg-[var(--bg-card-hover)]" style={{ borderColor: 'var(--border)' }}>
          <Megaphone className="h-5 w-5 text-[var(--text-muted)]" />
          <h2 className="mt-4 font-semibold text-[var(--text-primary)]">Ads Manager</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Ad configuration and code slots live here — not on Dashboard.</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]"><Code2 className="h-3.5 w-3.5" /> Manage ad codes</span>
        </a>
        <a href="/admin/settings" className="group rounded-xl border p-5 transition hover:bg-[var(--bg-card-hover)]" style={{ borderColor: 'var(--border)' }}>
          <Settings2 className="h-5 w-5 text-[var(--text-muted)]" />
          <h2 className="mt-4 font-semibold text-[var(--text-primary)]">Settings</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">System configuration stays isolated from analytics.</p>
        </a>
      </div>

      <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-xs text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
        <Activity className="h-4 w-4 shrink-0" /> Dashboard is read-only: no ads, SEO or settings data is edited here.
      </div>
    </div>
  );
}
