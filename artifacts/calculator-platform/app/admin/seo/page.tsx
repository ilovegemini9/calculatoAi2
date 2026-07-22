import { Search } from 'lucide-react';
import { ContentCard, StatCard } from '@/components/admin/Card';
import { EmptyState } from '@/components/admin/EmptyState';
import { ChartWrapper } from '@/components/admin/ChartWrapper';

export const metadata = { title: 'SEO Center — Admin' };

export default function SeoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">SEO Center</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Monitor and improve search engine visibility.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Indexed Pages"    icon={<Search className="w-4 h-4" />} />
        <StatCard label="Avg. Position"    icon={<Search className="w-4 h-4" />} />
        <StatCard label="Organic Clicks"   icon={<Search className="w-4 h-4" />} />
        <StatCard label="Core Web Vitals"  icon={<Search className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartWrapper title="Organic Traffic" hasData={false} />
        <ChartWrapper title="Top Keywords" hasData={false} />
      </div>

      <ContentCard title="Pages Audit" description="SEO health check per page.">
        <EmptyState
          icon={<Search className="w-5 h-5" />}
          title="No audit data available"
          description="Run an audit to see SEO recommendations."
        />
      </ContentCard>
    </div>
  );
}
