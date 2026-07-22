import { Plus } from 'lucide-react';
import { ContentCard } from '@/components/admin/Card';
import { DataTable, Column } from '@/components/admin/DataTable';

export const metadata = { title: 'AI Calculators — Admin' };

type Calc = { id: string; name: string; slug: string; status: string; updatedAt: string };

const columns: Column<Calc>[] = [
  { key: 'name',      header: 'Name' },
  { key: 'slug',      header: 'Slug',    className: 'w-40 font-mono text-xs' },
  { key: 'status',    header: 'Status',  className: 'w-28' },
  { key: 'updatedAt', header: 'Updated', className: 'w-36' },
];

export default function CalculatorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">AI Calculators</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Manage AI-generated calculators.
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white opacity-50 cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          New Calculator
        </button>
      </div>

      <ContentCard noPadding>
        <DataTable<Calc>
          columns={columns}
          data={[]}
          keyField="id"
          emptyTitle="No calculators yet"
          emptyDescription="AI-generated calculators will appear here."
        />
      </ContentCard>
    </div>
  );
}
