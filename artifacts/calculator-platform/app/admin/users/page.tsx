'use client';
import { fetchAdmin } from '@/lib/fetch-admin';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, UserPlus, Users, XCircle } from 'lucide-react';
import { ContentCard, StatCard } from '@/components/admin/Card';
import { DataTable, Column } from '@/components/admin/DataTable';

type User = { id: string; username: string; createdAt: string };

const columns: Column<User>[] = [
  { key: 'username', header: 'Username' },
  { key: 'createdAt', header: 'Created', className: 'w-52 font-mono text-xs' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdmin('/api/admin/users', { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load users.');
      const data = (await res.json()) as User[];
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage admin access and roles.</p>
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
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white opacity-50 cursor-not-allowed"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Users"  value={loading ? undefined : users.length} icon={<Users className="w-4 h-4" />} />
        <StatCard label="Active Today" icon={<Users className="w-4 h-4" />} />
        <StatCard label="Admin Roles"  value={loading ? undefined : users.length} icon={<Users className="w-4 h-4" />} />
      </div>

      <ContentCard title="User Accounts" noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : (
          <DataTable<User>
            columns={columns}
            data={users}
            keyField="id"
            emptyTitle="No users found"
            emptyDescription="Admin accounts will appear here."
          />
        )}
      </ContentCard>
    </div>
  );
}
