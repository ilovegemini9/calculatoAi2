'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AdminUser   { id: string; username: string; createdAt: string; }
interface LogEntry    { id: string; timestamp: string; level: 'INFO' | 'WARN' | 'ERROR'; message: string; route: string; }

export default function SecurityUsersPage() {
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [newUser, setNewUser]           = useState({ username: '', password: '' });
  const [creating, setCreating]         = useState(false);

  // Security events from logs
  const [secLogs, setSecLogs]           = useState<LogEntry[]>([]);
  const [secLogsLoading, setSecLogsLoading] = useState(true);
  const [authErrorCount, setAuthErrorCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => { setUsers(data); setUsersLoading(false); })
      .catch(() => { toast.error('Failed to load users.'); setUsersLoading(false); });

    // Fetch ERROR logs and filter for auth/login/security events
    fetch('/api/admin/logs?level=ERROR')
      .then((r) => r.json())
      .then((data: LogEntry[]) => {
        const securityEvents = data.filter(
          (l) =>
            l.route?.toLowerCase().includes('login') ||
            l.route?.toLowerCase().includes('auth') ||
            l.message?.toLowerCase().includes('unauthorized') ||
            l.message?.toLowerCase().includes('invalid') ||
            l.message?.toLowerCase().includes('forbidden') ||
            l.message?.toLowerCase().includes('credentials'),
        );
        setSecLogs(securityEvents);
        setAuthErrorCount(securityEvents.length);
        setSecLogsLoading(false);
      })
      .catch(() => { setSecLogsLoading(false); });
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
    } catch { toast.error('An error occurred.'); }
    finally { setCreating(false); }
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
    } catch { toast.error('An error occurred.'); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Security & Access Control
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage administrator accounts and review security events from the system error log.
        </p>
      </div>

      {/* ── Security summary row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Admin Accounts</span>
          <p className="text-4xl font-extrabold mt-1 text-blue-500">{usersLoading ? '—' : users.length}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Auth Errors (logged)</span>
          <p className={`text-4xl font-extrabold mt-1 ${authErrorCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {secLogsLoading ? '—' : authErrorCount}
          </p>
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Blocked IPs</span>
          <p className="text-4xl font-extrabold mt-1" style={{ color: 'var(--text-muted)' }}>—</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>No IP block list configured</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Active Sessions</span>
          <p className="text-4xl font-extrabold mt-1" style={{ color: 'var(--text-muted)' }}>—</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Session tracking not stored</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Users list ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            👥 Administrator Accounts — queried from adminUsers table
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
                          <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:underline font-bold">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Add user form ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            ➕ Add Administrator
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input
                type="text" required placeholder="e.g. jsmith"
                value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none text-xs"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password" required placeholder="Min 6 characters"
                value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none text-xs"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <button
              type="submit" disabled={creating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition"
            >
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </form>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              🔒 Passwords hashed with bcrypt before storage. Plain-text passwords are never written to disk.
            </p>
          </div>
        </div>
      </div>

      {/* ── Security events — from error logs ────────────────────────────── */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
          🚨 Security Events — queried from error_logs (auth-related)
        </h2>
        {secLogsLoading ? (
          <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>Scanning security events…</p>
        ) : secLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-3xl">✅</span>
            <p className="text-sm font-bold text-green-500">No security events detected</p>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              No failed login attempts or authorization errors found in the error log.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {secLogs.map((log) => (
              <div key={log.id} className="p-3 border rounded-xl flex items-start gap-3" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-500/15 text-red-500 shrink-0 mt-0.5">
                  {log.level}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{log.message}</p>
                  <p className="text-[10px] font-mono text-blue-500 mt-0.5">{log.route}</p>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rate limiting — no middleware in current architecture */}
        <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Rate Limiting & IP Blocking
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            No rate-limit middleware or IP block list is currently configured. Failed login attempts are captured in the error log above. To enforce rate limits and block IPs, connect a middleware layer (e.g. Next.js middleware with Upstash Redis) — counters and blocked IPs will appear here once active.
          </p>
        </div>
      </div>
    </div>
  );
}
