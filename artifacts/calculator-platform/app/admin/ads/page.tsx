'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  ExternalLink,
  Loader2,
  Megaphone,
  RefreshCw,
  Save,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { ContentCard, StatCard } from '@/components/admin/Card';
import type { AdPlacement, AdsSettings } from '@/lib/types';
import { AD_PLACEMENTS } from '@/lib/ads';

const inputClass = 'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const inputStyle = { borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked} className="flex w-full items-center justify-between gap-4 rounded-lg border px-3.5 py-3 text-left transition hover:border-blue-500/50" style={{ borderColor: 'var(--border)', backgroundColor: checked ? 'rgba(37,99,235,.06)' : 'var(--bg-input)' }}>
      <span><span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span><span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span></span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} /></span>
    </button>
  );
}

function Field({ label, value, onChange, type = 'text', hint }: { label: string; value: string | number; onChange: (value: string) => void; type?: 'text' | 'number'; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
      <input type={type} value={value} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 1000 : undefined} onChange={(event) => onChange(event.target.value)} className={inputClass} style={inputStyle} />
      {hint && <span className="mt-1.5 block text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

export default function AdsPage() {
  const [ads, setAds] = useState<AdsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch('/api/admin/ads', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load ad settings.');
      setAds((await response.json()).ads as AdsSettings);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load ad settings.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const updateSlot = (placement: AdPlacement, field: 'enabled' | 'slotId' | 'desktopHeight' | 'mobileHeight', value: string | boolean) => {
    setAds((current) => current ? { ...current, slots: { ...current.slots, [placement]: { ...current.slots[placement], [field]: field.includes('Height') ? Number(value) : value } } } : current);
  };

  const save = async () => {
    if (!ads) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ads) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save ad settings.');
      setAds(result.ads);
      setMessage({ type: 'success', text: 'Ad settings saved. Changes are live immediately without a redeploy.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save ad settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !ads) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>;
  const activeSlots = Object.values(ads.slots).filter((slot) => slot.enabled).length;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500"><Megaphone className="h-3.5 w-3.5" /> Monetization</div><h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Ads Manager</h1><p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">Configure Google AdSense or a custom network across every responsive placement.</p></div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => void load(true)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:border-blue-500 hover:text-blue-500" style={{ borderColor: 'var(--border)' }}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</button><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes</button></div>
      </div>
      {message && <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'}`}>{message.type === 'success' ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {message.text}</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Ads status" value={ads.enabled ? 'Enabled' : 'Off'} icon={<Megaphone className="h-4 w-4" />} />
        <StatCard label="Provider" value={ads.provider === 'adsense' ? 'AdSense' : 'Custom'} icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Active slots" value={activeSlots} icon={<Megaphone className="h-4 w-4" />} />
        <StatCard label="CLS protection" value="Reserved" icon={<ShieldCheck className="h-4 w-4" />} />
      </div>

      <ContentCard title="Network" description="Choose the provider and publisher identity used by the live ad slots." action={<Megaphone className="h-4 w-4 text-blue-500" />}>
        <div className="space-y-4">
          <Toggle label="Enable advertising" description="Show configured ads on public pages. Admin pages never render ads." checked={ads.enabled} onChange={(value) => setAds({ ...ads, enabled: value })} />
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Network</span><select value={ads.provider} onChange={(event) => setAds({ ...ads, provider: event.target.value as AdsSettings['provider'] })} className={inputClass} style={inputStyle}><option value="adsense">Google AdSense</option><option value="custom">Custom Network</option></select></label>
            <Field label="Publisher ID" value={ads.publisherId} onChange={(value) => setAds({ ...ads, publisherId: value })} hint="For AdSense, use the complete ca-pub-... publisher value." />
          </div>
          {ads.provider === 'custom' && <div className="grid gap-4 lg:grid-cols-2"><Field label="Custom network name" value={ads.customNetworkName} onChange={(value) => setAds({ ...ads, customNetworkName: value })} /><label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Custom network code</span><textarea value={ads.customNetworkCode} onChange={(event) => setAds({ ...ads, customNetworkCode: event.target.value })} rows={4} className={`${inputClass} resize-y font-mono text-xs`} style={inputStyle} /></label></div>}
        </div>
      </ContentCard>

      <ContentCard title="Ad placements" description="Each slot reserves its desktop and mobile height before the ad loads, preventing layout shift." action={<ShieldCheck className="h-4 w-4 text-emerald-500" />}>
        <div className="grid gap-4 lg:grid-cols-2">
          {AD_PLACEMENTS.map(({ key, label, description }) => {
            const slot = ads.slots[key];
            return <div key={key} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
              <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-[var(--text-primary)]">{label}</h3><p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p></div><button type="button" onClick={() => updateSlot(key, 'enabled', !slot.enabled)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${slot.enabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>{slot.enabled ? 'Enabled' : 'Disabled'}</button></div>
              <div className="space-y-4"><Field label="Slot ID" value={slot.slotId} onChange={(value) => updateSlot(key, 'slotId', value)} hint="AdSense slot number or custom network placement ID." /><div className="grid grid-cols-2 gap-3"><Field label="Desktop height (px)" type="number" value={slot.desktopHeight} onChange={(value) => updateSlot(key, 'desktopHeight', value)} /><Field label="Mobile height (px)" type="number" value={slot.mobileHeight} onChange={(value) => updateSlot(key, 'mobileHeight', value)} /></div></div>
            </div>;
          })}
        </div>
      </ContentCard>

      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]"><ShieldCheck className="h-4 w-4 text-emerald-500" /> CLS protection reserves every enabled slot before the network responds.<a href="https://support.google.com/adsense" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:underline">AdSense help <ExternalLink className="h-3 w-3" /></a></div>
    </div>
  );
}