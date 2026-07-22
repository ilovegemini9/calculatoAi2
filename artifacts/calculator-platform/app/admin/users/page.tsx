import { Users, UserPlus } from 'lucide-react';
import { StatCard, ContentCard } from '@/components/admin/Card';
import { DataTable, Column } from '@/components/admin/DataTable';

export const metadata = { title: 'Users — Admin' };

type User = { id: string; username: string; role: string; lastLogin: string; createdAt: string };

const columns: Column<User>[] = [
  { key: 'username',  header: 'Username' },
  { key: 'role',      header: 'Role',       className: 'w-32' },
  { key: 'lastLogin', header: 'Last Login', className: 'w-36' },
  { key: 'createdAt', header: 'Created',    className: 'w-36' },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Manage admin access and roles.
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white opacity-50 cursor-not-allowed"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Users"  icon={<Users className="w-4 h-4" />} />
        <StatCard label="Active Today" icon={<Users className="w-4 h-4" />} />
        <StatCard label="Admin Roles"  icon={<Users className="w-4 h-4" />} />
      </div>

      <ContentCard title="User Accounts" noPadding>
        <DataTable<User>
          columns={columns}
          data={[]}
          keyField="id"
          emptyTitle="No users found"
          emptyDescription="User accounts will appear here."
        />
      </ContentCard>
    </div>
  );
}
