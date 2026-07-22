import { BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/admin/Card';
import { ChartWrapper } from '@/components/admin/ChartWrapper';
import { ContentCard } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/EmptyState';

export const metadata = { title: 'Analytics — Admin' };

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Traffic, engagement, and performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Sessions (30d)"    icon={<BarChart3 className="w-4 h-4" />} />
        <StatCard label="Unique Visitors"   icon={<BarChart3 className="w-4 h-4" />} />
        <StatCard label="Bounce Rate"       icon={<BarChart3 className="w-4 h-4" />} />
        <StatCard label="Avg. Session Time" icon={<BarChart3 className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartWrapper title="Sessions Over Time"     description="Last 30 days" hasData={false} />
        <ChartWrapper title="Traffic by Source"      description="Last 30 days" hasData={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartWrapper title="Top Pages by Views"     hasData={false} />
        <ChartWrapper title="Device Breakdown"       hasData={false} />
      </div>

      <ContentCard title="Real-Time Visitors">
        <EmptyState
          icon={<BarChart3 className="w-5 h-5" />}
          title="No data available"
          description="Connect your analytics provider to see real-time visitors."
        />
      </ContentCard>
    </div>
  );
}
