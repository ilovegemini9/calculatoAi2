'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, Globe2, Loader2, RefreshCw, Save, Search, ShieldCheck, XCircle } from 'lucide-react';
import { ContentCard, StatCard } from '@/components/admin/Card';
import type { VerificationSettings } from '@/lib/types';

const inputClass = 'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const inputStyle = { borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked} className="flex w-full items-center justify-between gap-4 rounded-lg border px-3.5 py-3 text-left transition hover:border-blue-500/50" style={{ borderColor: 'var(--border)', backgroundColor: checked ? 'rgba(37,99,235,.06)' : 'var(--bg-input)' }}><span><span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span><span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span></span><span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} /></span></button>;
}

function Field({ label, value, onChange, type = 'text', hint }: { label: string; value: string; onChange: (value: string) => void; type?: 'text' | 'url'; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} style={inputStyle} />{hint && <span className="mt-1.5 block text-xs text-[var(--text-muted)]">{hint}</span>}</label>;
}

export default function VerificationsPage() {
  const [verification, setVerification] = useState<VerificationSettings | null>(null);
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
      const response = await fetch('/api/admin/verifications', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load verification settings.');
      setVerification((await response.json()).verification as VerificationSettings);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load verification settings.' });
    } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!verification) return;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch('/api/admin/verifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(verification) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save verification settings.');
      setVerification(result.verification);
      setMessage({ type: 'success', text: 'Verification settings saved. Tags are live immediately without a redeploy.' });
    } catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save verification settings.' }); }
    finally { setSaving(false); }
  };

  if (loading || !verification) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>;
  const configured = [verification.googleSearchConsole.verificationCode, verification.googleAdsense.verificationCode, verification.bing.verificationCode, verification.yandex.verificationCode].filter(Boolean).length;

  return <div className="space-y-6 pb-10">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500"><ShieldCheck className="h-3.5 w-3.5" /> Trust & discovery</div><h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Verification Center</h1><p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">Manage ownership and publisher verification tags without touching the codebase or redeploying.</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => void load(true)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:border-blue-500 hover:text-blue-500" style={{ borderColor: 'var(--border)' }}><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</button><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes</button></div></div>
    {message && <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'}`}>{message.type === 'success' ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {message.text}</div>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><StatCard label="Configured" value={`${configured}/4`} icon={<Check className="h-4 w-4" />} /><StatCard label="GSC" value={verification.googleSearchConsole.verificationCode ? 'Ready' : 'Not set'} icon={<Search className="h-4 w-4" />} /><StatCard label="AdSense" value={verification.googleAdsense.verificationCode ? 'Ready' : 'Not set'} icon={<ShieldCheck className="h-4 w-4" />} /><StatCard label="Custom tags" value={verification.customMetaTags ? 'Added' : 'None'} icon={<Globe2 className="h-4 w-4" />} /></div>

    <ContentCard title="Google Search Console" description="HTML meta-tag verification for the configured property." action={<Search className="h-4 w-4 text-blue-500" />}><div className="space-y-4"><Toggle label="Enable Google verification" description="Emit the verification tag in the document head." checked={verification.googleSearchConsole.enabled} onChange={(value) => setVerification({ ...verification, googleSearchConsole: { ...verification.googleSearchConsole, enabled: value } })} /><div className="grid gap-4 lg:grid-cols-2"><Field label="Property URL" type="url" value={verification.googleSearchConsole.propertyUrl} onChange={(value) => setVerification({ ...verification, googleSearchConsole: { ...verification.googleSearchConsole, propertyUrl: value } })} /><Field label="Verification code" value={verification.googleSearchConsole.verificationCode} onChange={(value) => setVerification({ ...verification, googleSearchConsole: { ...verification.googleSearchConsole, verificationCode: value } })} /></div></div></ContentCard>

    <div className="grid gap-6 lg:grid-cols-2">
      <ContentCard title="Google AdSense" description="Publisher verification for AdSense." action={<ShieldCheck className="h-4 w-4 text-blue-500" />}><div className="space-y-4"><Toggle label="Enable AdSense verification" description="Emit the google-adsense-account tag." checked={verification.googleAdsense.enabled} onChange={(value) => setVerification({ ...verification, googleAdsense: { ...verification.googleAdsense, enabled: value } })} /><Field label="Publisher ID" value={verification.googleAdsense.publisherId} onChange={(value) => setVerification({ ...verification, googleAdsense: { ...verification.googleAdsense, publisherId: value } })} /><Field label="Verification code" value={verification.googleAdsense.verificationCode} onChange={(value) => setVerification({ ...verification, googleAdsense: { ...verification.googleAdsense, verificationCode: value } })} /></div></ContentCard>
      <ContentCard title="Bing Webmaster Tools" description="Bing ownership verification." action={<Globe2 className="h-4 w-4 text-blue-500" />}><div className="space-y-4"><Toggle label="Enable Bing verification" description="Emit the msvalidate.01 tag." checked={verification.bing.enabled} onChange={(value) => setVerification({ ...verification, bing: { ...verification.bing, enabled: value } })} /><Field label="Verification code" value={verification.bing.verificationCode} onChange={(value) => setVerification({ ...verification, bing: { ...verification.bing, verificationCode: value } })} /></div></ContentCard>
      <ContentCard title="Yandex Webmaster" description="Yandex ownership verification." action={<Globe2 className="h-4 w-4 text-blue-500" />}><div className="space-y-4"><Toggle label="Enable Yandex verification" description="Emit the yandex-verification tag." checked={verification.yandex.enabled} onChange={(value) => setVerification({ ...verification, yandex: { ...verification.yandex, enabled: value } })} /><Field label="Verification code" value={verification.yandex.verificationCode} onChange={(value) => setVerification({ ...verification, yandex: { ...verification.yandex, verificationCode: value } })} /></div></ContentCard>
      <ContentCard title="Custom meta tags" description="Paste one or more meta tags. Only meta name/property/content attributes are emitted for safety." action={<Globe2 className="h-4 w-4 text-blue-500" />}><textarea value={verification.customMetaTags} onChange={(event) => setVerification({ ...verification, customMetaTags: event.target.value })} rows={8} placeholder={'<meta name="example" content="value" />'} className={`${inputClass} resize-y font-mono text-xs`} style={inputStyle} /></ContentCard>
    </div>
    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]"><Check className="h-4 w-4 text-emerald-500" /> Saved verification tags are rendered on the next request.<a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:underline">Open Search Console <ExternalLink className="h-3 w-3" /></a></div>
  </div>;
}