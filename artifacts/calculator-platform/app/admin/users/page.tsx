'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
}

export default function SecurityUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setUsersLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load users.');
        setUsersLoading(false);
      });
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        const user = await res.json();
        setUsers([...users, user]);
        setNewUser({ username: '', password: '' });
        toast.success(`Admin user "${user.username}" created.`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create user.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Revoke this admin account? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
        toast.success('Admin user revoked.');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete user.');
      }
    } catch {
      toast.error('An error occurred.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Security & Access Control
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage administrator accounts. All users have full admin access. Credential data is stored securely with bcrypt hashing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users list */}
        <div
          className="lg:col-span-2 rounded-2xl border p-6 space-y-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            👥 Administrator Accounts
          </h2>

          {usersLoading ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading accounts…</p>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl">👥</span>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No admin accounts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <th className="pb-3 font-bold uppercase">Username</th>
                    <th className="pb-3 font-bold uppercase">Created</th>
                    <th className="pb-3 font-bold uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {users.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-[var(--bg-card-hover)] transition">
                      <td className="py-3 font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                        {user.username}
                        {idx === 0 && (
                          <span className="ml-2 text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-black uppercase">Primary</span>
                        )}
                      </td>
                      <td className="py-3" style={{ color: 'var(--text-muted)' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        {idx === 0 ? (
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Protected</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-500 hover:underline font-bold"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create user form */}
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            ➕ Add Administrator
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. jsmith"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none text-xs"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none text-xs"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition"
            >
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </form>

          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              🔒 Passwords are hashed with bcrypt before storage. Plain-text passwords are never written to disk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
