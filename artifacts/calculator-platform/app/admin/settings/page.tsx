'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface FeatureFlags {
  aiEnabled: boolean;
  maintenanceMode: boolean;
}

interface Settings {
  openrouterApiKey: string;
  adsenseEnabled: boolean;
  adsenseCode: string;
  analyticsCode: string;
  featureFlags: FeatureFlags;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    openrouterApiKey: '',
    adsenseEnabled: false,
    adsenseCode: '',
    analyticsCode: '',
    featureFlags: {
      aiEnabled: true,
      maintenanceMode: false,
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to load settings');
      })
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Could not load current configurations.');
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('Platform configurations successfully updated.');
      } else {
        toast.error('Failed to update settings.');
      }
    } catch (err) {
      toast.error('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading platform settings...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Platform Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Configure integrations, API keys, monetization tags, and platform-wide feature flags.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* OpenRouter Box */}
        <div 
          className="rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              OpenRouter API Management
            </h2>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Provide your OpenRouter API Key to power the Advanced AI Calculator Factory. This connects server-side and is never exposed.
          </p>
          
          <div className="relative">
            <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              OpenRouter API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={settings.openrouterApiKey}
                onChange={(e) => setSettings({ ...settings, openrouterApiKey: e.target.value })}
                className="flex-1 p-3 border rounded-xl outline-none text-sm font-mono"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="px-4 border rounded-xl text-xs font-bold hover:bg-[var(--bg-card-hover)] transition shrink-0"
                style={{ borderColor: 'var(--border)' }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div 
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Feature Flags & Platform Controls
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3.5 p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <input
                type="checkbox"
                id="aiEnabled"
                checked={settings.featureFlags.aiEnabled}
                onChange={(e) => setSettings({
                  ...settings,
                  featureFlags: { ...settings.featureFlags, aiEnabled: e.target.checked }
                })}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="aiEnabled" className="cursor-pointer select-none">
                <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Enable AI Features</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Enables smart widgets, AI dynamic translations, and text summary models.
                </span>
              </label>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.featureFlags.maintenanceMode}
                onChange={(e) => setSettings({
                  ...settings,
                  featureFlags: { ...settings.featureFlags, maintenanceMode: e.target.checked }
                })}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="maintenanceMode" className="cursor-pointer select-none">
                <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Maintenance Mode</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Locks the front facing site to standard operators and displays a neat static message.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Third-Party Scripts */}
        <div 
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Third-Party Integrations & Scripts
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-4 rounded-xl border mb-2" style={{ borderColor: 'var(--border)' }}>
              <input
                type="checkbox"
                id="adsenseEnabled"
                checked={settings.adsenseEnabled}
                onChange={(e) => setSettings({ ...settings, adsenseEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="adsenseEnabled" className="cursor-pointer select-none">
                <span className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Enable Google AdSense Placements</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Turns on placeholder nodes across premium content layout grids.
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                AdSense Script Tags (HTML)
              </label>
              <textarea
                rows={4}
                value={settings.adsenseCode}
                onChange={(e) => setSettings({ ...settings, adsenseCode: e.target.value })}
                placeholder="<script async src='https://pagead2.googlesyndication.com/pagead/...'>"
                className="w-full p-3 border rounded-xl outline-none text-xs font-mono"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Google Analytics / Tracking Scripts
              </label>
              <textarea
                rows={4}
                value={settings.analyticsCode}
                onChange={(e) => setSettings({ ...settings, analyticsCode: e.target.value })}
                placeholder="<!-- Google tag (gtag.js) -->"
                className="w-full p-3 border rounded-xl outline-none text-xs font-mono"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save platform settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
