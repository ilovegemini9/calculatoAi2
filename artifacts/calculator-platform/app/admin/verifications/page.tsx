import { ShieldCheck } from 'lucide-react';
import { StatCard, ContentCard } from '@/components/admin/Card';
import { DataTable, Column } from '@/components/admin/DataTable';

export const metadata = { title: 'Verification Center — Admin' };

type Verification = { id: string; subject: string; type: string; status: string; submittedAt: string };

const columns: Column<Verification>[] = [
  { key: 'subject',     header: 'Subject' },
  { key: 'type',        header: 'Type',      className: 'w-32' },
  { key: 'status',      header: 'Status',    className: 'w-28' },
  { key: 'submittedAt', header: 'Submitted', className: 'w-36' },
];

export default function VerificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Verification Center</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Review and approve pending verifications.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Pending"  icon={<ShieldCheck className="w-4 h-4" />} />
        <StatCard label="Approved" icon={<ShieldCheck className="w-4 h-4" />} />
        <StatCard label="Rejected" icon={<ShieldCheck className="w-4 h-4" />} />
        <StatCard label="Total"    icon={<ShieldCheck className="w-4 h-4" />} />
      </div>

      <ContentCard title="Verification Queue" noPadding>
        <DataTable<Verification>
          columns={columns}
          data={[]}
          keyField="id"
          emptyTitle="No verifications pending"
          emptyDescription="Submitted verifications will appear here for review."
        />
      </ContentCard>
    </div>
  );
}
