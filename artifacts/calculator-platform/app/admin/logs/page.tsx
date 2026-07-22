import { ContentCard } from '@/components/admin/Card';
import { DataTable, Column } from '@/components/admin/DataTable';

export const metadata = { title: 'Logs — Admin' };

type LogEntry = { id: string; level: string; message: string; source: string; timestamp: string };

const columns: Column<LogEntry>[] = [
  { key: 'timestamp', header: 'Time',    className: 'w-40 font-mono text-xs' },
  { key: 'level',     header: 'Level',   className: 'w-20' },
  { key: 'source',    header: 'Source',  className: 'w-36 font-mono text-xs' },
  { key: 'message',   header: 'Message' },
];

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Logs</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          System and application event logs.
        </p>
      </div>

      <ContentCard title="Event Log" description="Most recent entries first." noPadding>
        <DataTable<LogEntry>
          columns={columns}
          data={[]}
          keyField="id"
          emptyTitle="No log entries"
          emptyDescription="Application events and errors will be recorded here."
        />
      </ContentCard>
    </div>
  );
}
