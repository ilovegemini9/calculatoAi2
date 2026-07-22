import { Megaphone } from 'lucide-react';
import { StatCard, ContentCard } from '@/components/admin/Card';
import { ChartWrapper } from '@/components/admin/ChartWrapper';
import { DataTable, Column } from '@/components/admin/DataTable';

export const metadata = { title: 'Ads Manager — Admin' };

type Ad = { id: string; name: string; placement: string; status: string; impressions: string };

const columns: Column<Ad>[] = [
  { key: 'name',        header: 'Ad Name' },
  { key: 'placement',   header: 'Placement', className: 'w-36' },
  { key: 'status',      header: 'Status',    className: 'w-28' },
  { key: 'impressions', header: 'Impressions',className: 'w-32 text-right' },
];

export default function AdsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Ads Manager</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Manage ad placements and monitor performance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Ads"       icon={<Megaphone className="w-4 h-4" />} />
        <StatCard label="Impressions (7d)" icon={<Megaphone className="w-4 h-4" />} />
        <StatCard label="Click-Through"    icon={<Megaphone className="w-4 h-4" />} />
        <StatCard label="Revenue (MTD)"    icon={<Megaphone className="w-4 h-4" />} />
      </div>

      <ChartWrapper title="Impressions Over Time" description="Last 30 days" hasData={false} />

      <ContentCard title="Ad Units" noPadding>
        <DataTable<Ad>
          columns={columns}
          data={[]}
          keyField="id"
          emptyTitle="No ad units configured"
          emptyDescription="Ad units and placements will appear here."
        />
      </ContentCard>
    </div>
  );
}
