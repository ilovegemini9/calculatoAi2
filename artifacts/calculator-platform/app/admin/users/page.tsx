'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  role: 'Super Admin' | 'Editor' | 'SEO Manager' | 'Author' | 'Viewer';
  email: string;
  status: 'Active' | 'Inactive';
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function SecurityUsersPage() {
  const [users, setUsers] = useState<User[]>([
    { id: '1', username: 'admin', role: 'Super Admin', email: 'admin@platform.com', status: 'Active' },
    { id: '2', username: 'seo_pro', role: 'SEO Manager', email: 'seo@platform.com', status: 'Active' },
    { id: '3', username: 'editor_writer', role: 'Editor', email: 'writer@platform.com', status: 'Active' },
    { id: '4', username: 'guest_analyst', role: 'Viewer', email: 'viewer@platform.com', status: 'Inactive' },
  ]);

  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    { id: '1', name: 'Gemini Synthesis Pipeline', description: 'Enable programmatically synthesizing SEO articles and FAQs on demand', enabled: true },
    { id: '2', name: 'Formula Sandbox Caching', description: 'Enable serverless function caching for complex calculator execution formulas', enabled: false },
    { id: '3', name: 'Static Sitemap Re-Index Trigger', description: 'Re-index the sitemap on any database save operation instantly', enabled: true },
    { id: '4', name: 'Verbose Error Telemetry Logs', description: 'Log full stack traces into /api/admin/logs instead of generic logs', enabled: false },
  ]);

  const [newUser, setNewUser] = useState({ username: '', role: 'Editor' as User['role'], email: '' });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email) return;

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username,
      role: newUser.role,
      email: newUser.email,
      status: 'Active',
    };

    setUsers([...users, user]);
    setNewUser({ username: '', role: 'Editor', email: '' });
    toast.success('Admin seat invitation dispatched!');
  };

  const handleDeleteUser = (id: string) => {
    if (id === '1') {
      toast.error('The default system administrator account cannot be deleted.');
      return;
    }
    setUsers(users.filter((u) => u.id !== id));
    toast.success('Admin user revoked.');
  };

  const toggleFlag = (id: string) => {
    setFeatureFlags(featureFlags.map((f) => {
      if (f.id === id) {
        toast.success(`Feature Flag "${f.name}" ${!f.enabled ? 'Enabled' : 'Disabled'}`);
        return { ...f, enabled: !f.enabled };
      }
      return f;
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Security & Access Control
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage administrator credentials, fine-grained access roles (Viewer to Super Admin), and real-time operational feature flags.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users manager */}
        <div 
          className="lg:col-span-2 rounded-2xl border p-6 space-y-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            👥 Seat Allocation & Permissions Manager
          </h2>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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
                Email
              </label>
              <input
                type="email"
                required
                placeholder="jsmith@platform.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none text-xs"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Assigned Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
                  className="w-full p-2.5 border rounded-xl outline-none text-xs cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="SEO Manager">SEO Manager</option>
                  <option value="Author">Author</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <button
                type="submit"
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-md shadow-blue-600/10"
              >
                Add Seat
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <th className="pb-3 font-bold uppercase">Username</th>
                  <th className="pb-3 font-bold uppercase">Email</th>
                  <th className="pb-3 font-bold uppercase">Assigned Role</th>
                  <th className="pb-3 font-bold uppercase">Status</th>
                  <th className="pb-3 font-bold uppercase text-right">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--bg-card-hover)] transition">
                    <td className="py-3 font-mono">{user.username}</td>
                    <td className="py-3 font-mono">{user.email}</td>
                    <td className="py-3">
                      <span className="bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`font-bold ${user.status === 'Active' ? 'text-green-500' : 'text-orange-500'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:underline font-bold"
                        disabled={user.id === '1'}
                      >
                        Revoke Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Flags */}
        <div 
          className="rounded-2xl border p-6 space-y-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              🏳️ Platform Feature Flags
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Enable or disable hot microservices instantly.
            </p>
          </div>

          <div className="space-y-4">
            {featureFlags.map((flag) => (
              <div key={flag.id} className="flex items-start justify-between gap-4 p-3 rounded-xl border bg-[var(--bg-input)]" style={{ borderColor: 'var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{flag.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{flag.description}</p>
                </div>
                <button
                  onClick={() => toggleFlag(flag.id)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors relative shrink-0 duration-200 ${
                    flag.enabled ? 'bg-blue-500' : 'bg-[var(--border)]'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 transform ${
                    flag.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
