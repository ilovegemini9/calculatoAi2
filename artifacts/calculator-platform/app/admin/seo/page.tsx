'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Redirect {
  id: string; oldUrl: string; newUrl: string; statusCode: number; createdAt?: string;
}

interface SeoCheck {
  name: string; status: string; details: string; score: number;
}

interface SeoAuditData {
  calculators: {
    total: number; indexed: number; nonIndexed: number;
    missingMeta: number; missingFaq: number; missingSchema: number;
    missingContent: number; missingInternalLinks: number;
  };
  articles: {
    total: number; missingMeta: number; missingCanonical: number;
  };
  redirects: number;
  checks: SeoCheck[];
}

export default function SEOAuditPage() {
  const [redirects, setRedirects]         = useState<Redirect[]>([]);
  const [redirectsLoading, setRedirectsLoading] = useState(true);
  const [newRedirect, setNewRedirect]     = useState({ oldUrl: '', newUrl: '', statusCode: 301 });
  const [saving, setSaving]               = useState(false);

  const [auditData, setAuditData]         = useState<SeoAuditData | null>(null);
  const [auditLoading, setAuditLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/admin/redirects')
      .then((r) => r.json())
      .then((data) => { setRedirects(data); setRedirectsLoading(false); })
      .catch(() => { toast.error('Failed to load redirects.'); setRedirectsLoading(false); });

    fetch('/api/admin/seo-audit')
      .then((r) => r.json())
      .then((data) => { setAuditData(data); setAuditLoading(false); })
      .catch(() => { toast.error('Failed to load SEO audit data.'); setAuditLoading(false); });
  }, []);

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedirect.oldUrl || !newRedirect.newUrl) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRedirect),
      });
      if (res.ok) {
        const saved = await res.json();
        setRedirects([...redirects, saved]);
        setNewRedirect({ oldUrl: '', newUrl: '', statusCode: 301 });
        toast.success('Redirect rule saved to database.');
      } else toast.error('Failed to save redirect.');
    } catch { toast.error('An error occurred.'); }
    finally { setSaving(false); }
  };

  const handleDeleteRedirect = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/redirects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRedirects(redirects.filter((r) => r.id !== id));
        toast.success('Redirect rule deleted.');
      } else toast.error('Failed to delete redirect.');
    } catch { toast.error('An error occurred.'); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          SEO Audit Hub
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Platform SEO health checks computed from live database tables and static config.
        </p>
      </div>

      {/* ── Coverage stats — from /api/admin/seo-audit ─────────────────────── */}
      {auditLoading ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Running SEO audit against database…
        </div>
      ) : auditData && (
        <>
          {/* Calculator index coverage */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Calculator Index Coverage — queried from calculators table + static config
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Calculators',    value: auditData.calculators.total,              color: 'text-blue-500'   },
                { label: 'Indexed',               value: auditData.calculators.indexed,            color: 'text-green-500'  },
                { label: 'Non-Indexed (Draft)',   value: auditData.calculators.nonIndexed,         color: 'text-yellow-500' },
                { label: 'Missing Meta',          value: auditData.calculators.missingMeta,        color: auditData.calculators.missingMeta  > 0 ? 'text-red-500' : 'text-green-500' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <p className={`text-4xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content coverage */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Content Coverage
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Missing FAQ',             value: auditData.calculators.missingFaq,           bad: auditData.calculators.missingFaq           > 0 },
                { label: 'Missing Schema',          value: auditData.calculators.missingSchema,        bad: auditData.calculators.missingSchema        > 0 },
                { label: 'Missing How-To Content',  value: auditData.calculators.missingContent,       bad: auditData.calculators.missingContent       > 0 },
                { label: 'Missing Source Links',    value: auditData.calculators.missingInternalLinks, bad: auditData.calculators.missingInternalLinks > 0 },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <p className={`text-4xl font-extrabold mt-1 ${s.bad ? 'text-red-500' : 'text-green-500'}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Article coverage */}
          {auditData.articles.total > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                Article SEO Coverage — queried from articles table
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Articles',       value: auditData.articles.total,            color: 'text-blue-500'   },
                  { label: 'Missing Description',  value: auditData.articles.missingMeta,       color: auditData.articles.missingMeta      > 0 ? 'text-red-500' : 'text-green-500' },
                  { label: 'Missing Canonical',    value: auditData.articles.missingCanonical,  color: auditData.articles.missingCanonical  > 0 ? 'text-red-500' : 'text-green-500' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                    <p className={`text-4xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health checks — from API (computed, not hardcoded) */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Platform Health Checks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {auditData.checks.map((check) => (
                <div
                  key={check.name}
                  className="rounded-2xl border p-5 space-y-2 relative overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-500">{check.name}</span>
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                      check.score >= 90 ? 'bg-green-500/10 text-green-500' :
                      check.score >= 70 ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {check.score}%
                    </span>
                  </div>
                  <p className="text-lg font-black mt-1" style={{ color: 'var(--text-primary)' }}>{check.status}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{check.details}</p>
                  <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: 'var(--border)' }}>
                    <div
                      className={`h-full ${check.score >= 90 ? 'bg-green-500' : check.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${check.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Custom Redirect Rules — DB-backed ──────────────────────────────── */}
      <div className="rounded-2xl border p-6 space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            🔗 Custom Redirect Rules
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {redirectsLoading ? 'Loading…' : `${redirects.length} rule${redirects.length !== 1 ? 's' : ''} in database`}
          </span>
        </div>

        <form onSubmit={handleAddRedirect} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Source URL (old)</label>
            <input
              type="text" required placeholder="/mortgage-calculator"
              value={newRedirect.oldUrl} onChange={(e) => setNewRedirect({ ...newRedirect, oldUrl: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none text-xs"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Destination URL (new)</label>
            <input
              type="text" required placeholder="/mortgage-payment-calculator"
              value={newRedirect.newUrl} onChange={(e) => setNewRedirect({ ...newRedirect, newUrl: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none text-xs"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>HTTP Status</label>
            <select
              value={newRedirect.statusCode} onChange={(e) => setNewRedirect({ ...newRedirect, statusCode: Number(e.target.value) })}
              className="w-full p-2.5 border rounded-xl outline-none text-xs cursor-pointer"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="301">301 — Permanent</option>
              <option value="302">302 — Temporary</option>
            </select>
          </div>
          <button
            type="submit" disabled={saving}
            className="w-full p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition"
          >
            {saving ? 'Saving…' : 'Add Rule'}
          </button>
        </form>

        {redirectsLoading ? (
          <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading redirect rules…</p>
        ) : redirects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-3xl">🔗</span>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No custom redirect rules</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Add rules above to preserve search rankings when URLs change.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <th className="pb-3 font-bold uppercase">Source</th>
                  <th className="pb-3 font-bold uppercase">Destination</th>
                  <th className="pb-3 font-bold uppercase text-center">Status</th>
                  <th className="pb-3 font-bold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {redirects.map((red) => (
                  <tr key={red.id} className="hover:bg-[var(--bg-card-hover)] transition">
                    <td className="py-3 font-mono" style={{ color: 'var(--text-primary)' }}>{red.oldUrl}</td>
                    <td className="py-3 font-mono text-blue-500">{red.newUrl}</td>
                    <td className="py-3 text-center">
                      <span className="bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded">{red.statusCode}</span>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => handleDeleteRedirect(red.id)} className="text-red-500 hover:underline font-bold">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
