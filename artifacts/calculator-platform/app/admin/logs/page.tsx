'use client';
import { fetchAdmin } from '@/lib/fetch-admin';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { ContentCard } from '@/components/admin/Card';
import { DataTable, Column } from '@/components/admin/DataTable';

type LogEntry = { id: string; level: string; message: string; route: string; timestamp: string };

const columns: Column<LogEntry>[] = [
  { key: 'timestamp', header: 'Time',    className: 'w-44 font-mono text-xs' },
  { key: 'level',     header: 'Level',   className: 'w-20' },
  { key: 'route',     header: 'Route',   className: 'w-40 font-mono text-xs' },
  { key: 'message',   header: 'Message' },
];

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdmin('/api/admin/logs', { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load logs.');
      const data = (await res.json()) as LogEntry[];
      // Newest first
      setLogs(Array.isArray(data) ? [...data].reverse() : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const clearLogs = async () => {
    setClearing(true);
    try {
      await fetchAdmin('/api/admin/logs', { method: 'DELETE' });
      setLogs([]);
    } catch {
      // ignore
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Logs</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">System and application event logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
            style={{ borderColor: 'var(--border)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => void clearLogs()}
            disabled={clearing || logs.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-red-500 transition hover:border-red-500 disabled:opacity-40"
            style={{ borderColor: 'var(--border)' }}
          >
            {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <ContentCard title="Event Log" description={`${logs.length} entr${logs.length === 1 ? 'y' : 'ies'} — most recent first`} noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : (
          <DataTable<LogEntry>
            columns={columns}
            data={logs}
            keyField="id"
            emptyTitle="No log entries"
            emptyDescription="Application events and errors will be recorded here."
          />
        )}
      </ContentCard>
    </div>
  );
}
