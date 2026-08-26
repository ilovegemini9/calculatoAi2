import Link from 'next/link';
import { BarChart3, TrendingUp, Gauge, ExternalLink } from 'lucide-react';
import { getDb } from '@/lib/db';
import { StatCard, ContentCard } from '@/components/admin/Card';
import { TrafficChart } from '@/components/admin/dashboard/TrafficChart';
import { TopCalculatorsChart } from '@/components/admin/dashboard/TopCalculatorsChart';

export const metadata = { title: 'Dashboard — Admin' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const db = await getDb();
  const totalViews = db.analytics.reduce((sum, item) => sum + item.views, 0);
  const activeCalculators = db.calculators.filter((item) => item.status === 'active').length;
  const byDate: Record<string, number> = {};
  for (const item of db.analytics) byDate[item.date] = (byDate[item.date] ?? 0) + item.views;
  const traffic = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, views]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), views,
  }));
  const names: Record<string, string> = {};
  for (const item of db.calculators) { names[item.id] = item.name; names[item.slug] = item.name; }
  const byCalculator: Record<string, number> = {};
  for (const item of db.analytics) if (item.calculatorId) byCalculator[item.calculatorId] = (byCalculator[item.calculatorId] ?? 0) + item.views;
  const topCalculators = Object.entries(byCalculator).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id, views]) => ({ name: names[id] ?? id, views }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Admin</p><h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1><p className="mt-1 text-sm text-[var(--text-muted)]">Simple overview of your platform performance.</p></div>
        <Link href="/admin/analytics" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium" style={{ borderColor: 'var(--border)' }}><BarChart3 className="h-4 w-4" /> Analytics <ExternalLink className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Page Views" value={totalViews.toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Active Calculators" value={activeCalculators} icon={<Gauge className="h-4 w-4" />} />
        <StatCard label="Analytics Days" value={traffic.length} icon={<BarChart3 className="h-4 w-4" />} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ContentCard title="Traffic overview" description="Last 14 days"><TrafficChart data={traffic} /></ContentCard>
        <ContentCard title="Top calculators" description="Ranked by page views"><TopCalculatorsChart data={topCalculators} /></ContentCard>
      </div>
      <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-semibold text-[var(--text-primary)]">Admin sections</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Analytics, SEO, Ads, Users, Logs and Settings stay in their own sections.</p>
      </div>
    </div>
  );
}