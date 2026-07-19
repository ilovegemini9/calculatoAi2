'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface Redirect {
  id: string;
  oldUrl: string;
  newUrl: string;
  statusCode: number;
}

export default function SEOAuditPage() {
  const [redirects, setRedirects] = useState<Redirect[]>([
    { id: '1', oldUrl: '/calculator/old-mortgage', newUrl: '/calculator/mortgage-payment', statusCode: 301 },
    { id: '2', oldUrl: '/blog/interest-rates-2025', newUrl: '/blog/mortgage-rates-outlook', statusCode: 301 },
  ]);
  const [newRedirect, setNewRedirect] = useState({ oldUrl: '', newUrl: '', statusCode: 301 });
  
  const seoAudits = [
    { name: 'llms.txt', status: 'Optimal', details: 'Full programmatic catalog available at /llms.txt', score: 100 },
    { name: 'Robots.txt config', status: 'Healthy', details: 'Standard disallows for /admin and /api paths in place', score: 100 },
    { name: 'Dynamic sitemap.xml', status: 'Optimal', details: 'Auto-rebuilds and submits to Search Console daily', score: 98 },
    { name: 'JSON-LD Schema Coverage', status: '9/11 Passed', details: 'Two dynamic calculators missing itemSchema markup', score: 82 },
    { name: 'Alt Attributes Check', status: 'Action Required', details: '3 custom images in blog lack responsive alt tags', score: 75 },
    { name: 'Duplicate Meta Content', status: 'Optimal', details: 'No duplicated heading layouts detected', score: 100 },
  ];

  const handleAddRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRedirect.oldUrl || !newRedirect.newUrl) return;
    
    const item: Redirect = {
      id: Date.now().toString(),
      ...newRedirect,
    };
    setRedirects([...redirects, item]);
    setNewRedirect({ oldUrl: '', newUrl: '', statusCode: 301 });
    toast.success('Dynamic redirect link configured successfully!');
  };

  const handleDeleteRedirect = (id: string) => {
    setRedirects(redirects.filter((r) => r.id !== id));
    toast.success('Redirect rule deleted.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          SEO Audit Hub
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage sitemaps, programmatically track redirects, diagnose missing image meta, and audit general page indices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seoAudits.map((audit) => (
          <div 
            key={audit.name} 
            className="rounded-2xl border p-5 space-y-2 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500">{audit.name}</span>
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                audit.score >= 90 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {audit.score}%
              </span>
            </div>
            <p className="text-lg font-black mt-1" style={{ color: 'var(--text-primary)' }}>{audit.status}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{audit.details}</p>
            
            <div className="absolute bottom-0 left-0 h-1 bg-[var(--border)] w-full">
              <div 
                className={`h-full ${audit.score >= 90 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                style={{ width: `${audit.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Redirect Manager */}
      <div 
        className="rounded-2xl border p-6 space-y-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            🔗 Dynamic Redirect link & Canonical Manager
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Avoid broken Google search positions</span>
        </div>

        <form onSubmit={handleAddRedirect} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Source Link (oldUrl)
            </label>
            <input
              type="text"
              required
              placeholder="/calculator/old-path"
              value={newRedirect.oldUrl}
              onChange={(e) => setNewRedirect({ ...newRedirect, oldUrl: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none text-xs"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Destination Link (newUrl)
            </label>
            <input
              type="text"
              required
              placeholder="/calculator/new-path"
              value={newRedirect.newUrl}
              onChange={(e) => setNewRedirect({ ...newRedirect, newUrl: e.target.value })}
              className="w-full p-2.5 border rounded-xl outline-none text-xs"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              HTTP Status Code
            </label>
            <select
              value={newRedirect.statusCode}
              onChange={(e) => setNewRedirect({ ...newRedirect, statusCode: Number(e.target.value) })}
              className="w-full p-2.5 border rounded-xl outline-none text-xs cursor-pointer"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="301">301 - Permanent</option>
              <option value="302">302 - Temporary</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full p-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-md shadow-blue-600/10"
          >
            Create Rule
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <th className="pb-3 font-bold uppercase">Original Link</th>
                <th className="pb-3 font-bold uppercase">Redirect Destination</th>
                <th className="pb-3 font-bold uppercase text-center">Status</th>
                <th className="pb-3 font-bold uppercase text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {redirects.map((red) => (
                <tr key={red.id} className="hover:bg-[var(--bg-card-hover)] transition">
                  <td className="py-3 font-mono">{red.oldUrl}</td>
                  <td className="py-3 font-mono text-blue-500">{red.newUrl}</td>
                  <td className="py-3 text-center">
                    <span className="bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded">
                      {red.statusCode}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeleteRedirect(red.id)}
                      className="text-red-500 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
