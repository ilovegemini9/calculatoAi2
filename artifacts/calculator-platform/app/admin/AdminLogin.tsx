'use client';

import { useState } from 'react';
import { siteConfig } from '@/config/site';

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // Force full page reload to trigger server session refresh
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md border rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="p-8 border-b text-center" style={{ borderColor: 'var(--border)' }}>
          <span className="text-4xl block mb-2" aria-hidden="true">🧮</span>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {siteConfig.name}
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-1 text-blue-500">
            System Administration Console
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-semibold text-center leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Operator Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              className="w-full p-3 border rounded-xl outline-none transition text-sm font-medium"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Security Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 border rounded-xl outline-none transition text-sm font-medium"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {loading ? 'Authenticating Credentials...' : 'Unlock Console Session'}
          </button>
          
          <div className="text-center text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Secured by platform-grade auth cookies
          </div>
        </form>
      </div>
    </div>
  );
}
