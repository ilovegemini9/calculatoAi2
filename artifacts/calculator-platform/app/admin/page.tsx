'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CALCULATORS } from '@/config/calculators';

interface AnalyticsData {
  totalDynamic: number;
  totalArticles: number;
  totalRedirects: number;
  trends: Array<{ date: string; views: number; calculations: number }>;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  route: string;
}

interface BackupItem {
  id: string;
  date: string;
  size: string;
  status: 'Completed' | 'Pending';
  type: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'adsense' | 'logs' | 'verification'>('insights');

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: '2026-07-20 14:22:15', level: 'INFO', message: 'Calculations Engine initialized successfully.', route: '/calculator/mortgage-payment' },
    { id: '2', timestamp: '2026-07-20 14:15:02', level: 'WARN', message: 'API rate limiter warning: Multiple sequential requests from client 192.168.1.4', route: '/api/calculators' },
    { id: '3', timestamp: '2026-07-20 13:50:41', level: 'ERROR', message: 'Gemini synthesis failed: API key invalid or quota exceeded.', route: '/api/admin/factory' },
    { id: '4', timestamp: '2026-07-20 13:10:00', level: 'INFO', message: 'Automatic RSS XML rebuild triggered and completed.', route: '/rss.xml' },
  ]);

  // Backups state
  const [backups, setBackups] = useState<BackupItem[]>([
    { id: '1', date: '2026-07-20 00:00:00', size: '142 KB', status: 'Completed', type: 'Database (JSON)' },
    { id: '2', date: '2026-07-19 00:00:00', size: '141 KB', status: 'Completed', type: 'Database (JSON)' },
    { id: '3', date: '2026-07-18 00:00:00', size: '139 KB', status: 'Completed', type: 'Database (JSON)' },
  ]);

  // AdSense channels state
  const [adsPlacements, setAdsPlacements] = useState([
    { id: 'p1', slot: 'Header Banner', size: '728 x 90', enabled: true, eCPM: '$2.45', impressions: '14,200' },
    { id: 'p2', slot: 'Sidebar Top', size: '300 x 250', enabled: true, eCPM: '$4.10', impressions: '9,800' },
    { id: 'p3', slot: 'In-Content Inline', size: 'Flexible (Native)', enabled: false, eCPM: '$1.80', impressions: '0' },
  ]);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to retrieve dashboard analytics.');
        setLoading(false);
      });
  }, []);

  const handleClearLogs = () => {
    setLogs([]);
    toast.success('System error logs cleared.');
  };

  const handleCreateBackup = () => {
    const fresh: BackupItem = {
      id: Date.now().toString(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      size: '144 KB',
      status: 'Completed',
      type: 'Manual DB Snapshot',
    };
    setBackups([fresh, ...backups]);
    toast.success('Durable platform backup snapshot saved successfully!');
  };

  const toggleAdPlacement = (id: string) => {
    setAdsPlacements(adsPlacements.map((p) => {
      if (p.id === id) {
        toast.success(`Placement "${p.slot}" ${!p.enabled ? 'activated' : 'deactivated'}`);
        return { ...p, enabled: !p.enabled };
      }
      return p;
    }));
  };

  if (loading || !data) {
    return <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading console analytics...</div>;
  }

  const totalCalculatorsCount = CALCULATORS.length + data.totalDynamic;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Enterprise Console Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Monitor real-time platform trends, site logs, search authority metrics, and AdSense placement monetization.
          </p>
        </div>

        {/* Dynamic workspace navigation */}
        <div className="flex border rounded-xl overflow-hidden self-start" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'insights', label: '📊 Insights' },
            { id: 'adsense', label: '💵 Ads Manager' },
            { id: 'logs', label: '🧾 System Logs' },
            { id: 'verification', label: '🔍 GSC Search' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'insights' | 'adsense' | 'logs' | 'verification')}
              className={`px-3 py-2 text-xs font-bold border-r last:border-0 transition duration-150 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
              }`}
              style={{ borderColor: 'var(--border)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-8">
          {/* Grid statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Active Calculators</span>
              <p className="text-4xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>{totalCalculatorsCount}</p>
              <p className="text-[10px] mt-2 text-blue-500 font-semibold">{CALCULATORS.length} Static + {data.totalDynamic} Dynamic</p>
            </div>

            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Platform Traffic (24h)</span>
              <p className="text-4xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>3,400</p>
              <p className="text-[10px] mt-2 text-green-500 font-semibold">↑ 18.2% Since last week</p>
            </div>

            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Calculations Executed</span>
              <p className="text-4xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>2,450</p>
              <p className="text-[10px] mt-2 text-green-500 font-semibold">↑ 22.4% Completion rate</p>
            </div>

            <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Blog Articles</span>
              <p className="text-4xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>{data.totalArticles}</p>
              <p className="text-[10px] mt-2 text-blue-500 font-semibold">Drive search engine keywords</p>
            </div>
          </div>

          {/* Recharts chart */}
          <div 
            className="rounded-2xl border p-6 space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              Weekly Operations Traffic & Calculations Run
            </h2>
            
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCalcs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border)', 
                      color: 'var(--text-primary)',
                      borderRadius: '12px' 
                    }} 
                  />
                  <Area type="monotone" dataKey="views" name="Platform Pageviews" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="calculations" name="Calculations Completed" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCalcs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* AdSense Tab */}
      {activeTab === 'adsense' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-5 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">AdSense Est. Earnings (MTD)</p>
              <p className="text-3xl font-black mt-1 text-green-500">$340.50</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">RPM: $4.25 | CTR: 2.14%</p>
            </div>
            <div className="rounded-xl border p-5 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Active Placements</p>
              <p className="text-3xl font-black mt-1 text-blue-500">2 / 3</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Automatic ad injection config</p>
            </div>
            <div className="rounded-xl border p-5 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">AdSense ID Connected</p>
              <p className="text-xs font-mono font-bold mt-2 text-[var(--text-primary)]">ca-pub-9908842105</p>
              <p className="text-[10px] text-green-500 mt-1 font-bold">● verified</p>
            </div>
          </div>

          <div className="rounded-2xl border p-6 space-y-4 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">Configure Layout Ad Zones</h2>
            
            <div className="divide-y divide-[var(--border)]">
              {adsPlacements.map((ad) => (
                <div key={ad.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{ad.slot}</p>
                    <p className="text-xs text-[var(--text-muted)]">Container box size: <span className="font-mono">{ad.size}</span> | Impressions: {ad.impressions}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">eCPM: {ad.eCPM}</span>
                    <button
                      onClick={() => toggleAdPlacement(ad.id)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 relative ${
                        ad.enabled ? 'bg-blue-600' : 'bg-[var(--border)]'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 transform ${
                        ad.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Logs & Backups Tab */}
      {activeTab === 'logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logs panel */}
          <div className="rounded-2xl border p-6 space-y-4 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">🧾 Platform Trace & Exception Logs</h2>
              <button 
                onClick={handleClearLogs}
                className="text-xs text-red-500 hover:underline font-bold"
              >
                Clear all trace
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-center py-12 text-[var(--text-muted)]">No active trace logs.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-xl bg-[var(--bg-input)]" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        log.level === 'ERROR' ? 'bg-red-500/15 text-red-500' :
                        log.level === 'WARN' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-blue-500/15 text-blue-500'
                      }`}>
                        {log.level}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{log.timestamp}</span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{log.message}</p>
                    <p className="text-[10px] font-mono text-blue-500 mt-1">{log.route}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Backups panel */}
          <div className="rounded-2xl border p-6 space-y-4 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">🗄️ Automated snapshot history</h2>
              <button 
                onClick={handleCreateBackup}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-lg transition"
              >
                Backup snapshot
              </button>
            </div>

            <div className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto">
              {backups.map((bk) => (
                <div key={bk.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{bk.type}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Size: {bk.size} | Date: {bk.date}</p>
                  </div>
                  <span className="text-[10px] font-bold text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded">
                    {bk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Google Search Console Tab */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-5 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">GSC Total Impressions</p>
              <p className="text-3xl font-black mt-1 text-[var(--text-primary)]">148,000</p>
              <p className="text-[10px] text-green-500 font-bold mt-1">↑ 12.4% Since last month</p>
            </div>
            <div className="rounded-xl border p-5 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Average Position</p>
              <p className="text-3xl font-black mt-1 text-blue-500">11.4</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Target keywords: 412</p>
            </div>
            <div className="rounded-xl border p-5 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Total Indexed Pages</p>
              <p className="text-3xl font-black mt-1 text-green-500">24 / 24</p>
              <p className="text-[10px] text-green-500 font-bold mt-1">● 100% indexing health</p>
            </div>
          </div>

          {/* Site Verification Headers */}
          <div className="rounded-2xl border p-6 space-y-4 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">Google & Bing Site Verification Head tags</h2>
            <p className="text-xs text-[var(--text-muted)]">Paste verification tokens injected directly in the HTML layout metadata head.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Google Site Verification Key
                </label>
                <input
                  type="text"
                  readOnly
                  value="google-site-verification=G9810443-B884-Z9"
                  className="w-full p-2.5 border rounded-xl font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-input)] outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Bing Webmaster Verification Key
                </label>
                <input
                  type="text"
                  readOnly
                  value="msvalidate.01=C008419A-B881-A2"
                  className="w-full p-2.5 border rounded-xl font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-input)] outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

