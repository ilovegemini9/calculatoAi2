'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  TestTube2,
  XCircle,
} from 'lucide-react';
import { ContentCard, StatCard } from '@/components/admin/Card';
import type { AiProvider } from '@/lib/types';

type PublicProvider = {
  enabled: boolean;
  defaultModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  dailyBudget: number;
  monthlyBudget: number;
  apiKeyConfigured: boolean;
  apiKeyMasked: string;
};

type PublicAi = {
  activeProvider: AiProvider;
  providers: Record<AiProvider, PublicProvider>;
  usage: {
    dailyRequests: number;
    monthlyRequests: number;
    dailyTokens: number;
    monthlyTokens: number;
    lastDay: string;
    lastMonth: string;
    cacheVersion: number;
  };
};

type ProviderDraft = PublicProvider & { apiKey: string };
type Draft = Omit<PublicAi, 'providers'> & { providers: Record<AiProvider, ProviderDraft> };

const PROVIDERS: Array<{ key: AiProvider; label: string; description: string; color: string }> = [
  { key: 'openrouter', label: 'OpenRouter', description: 'Multi-model routing and fallbacks', color: 'text-violet-500' },
  { key: 'openai', label: 'OpenAI', description: 'GPT models through the OpenAI API', color: 'text-emerald-500' },
  { key: 'gemini', label: 'Gemini', description: 'Google AI Studio models', color: 'text-blue-500' },
  { key: 'anthropic', label: 'Anthropic', description: 'Claude models through Anthropic', color: 'text-orange-500' },
];

const inputClass = 'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const inputStyle = { borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };

function providerDraft(ai: PublicAi): Draft {
  return {
    activeProvider: ai.activeProvider,
    usage: ai.usage,
    providers: Object.fromEntries(
      PROVIDERS.map(({ key }) => [key, { ...ai.providers[key], apiKey: '' }]),
    ) as Record<AiProvider, ProviderDraft>,
  };
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  suffix,
  hint,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
      <div className="relative">
        <input type={type} value={value} min={type === 'number' ? 0 : undefined} onChange={(event) => onChange(event.target.value)} className={`${inputClass} ${suffix ? 'pr-12' : ''}`} style={inputStyle} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">{suffix}</span>}
      </div>
      {hint && <span className="mt-1.5 block text-xs text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description: string }) {
  return (
    <button type="button" aria-pressed={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-lg border px-3.5 py-3 text-left transition hover:border-blue-500/50" style={{ borderColor: 'var(--border)', backgroundColor: checked ? 'rgba(37,99,235,.06)' : 'var(--bg-input)' }}>
      <span><span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span><span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span></span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} /></span>
    </button>
  );
}

export default function AiSettingsPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selected, setSelected] = useState<AiProvider>('openrouter');
  const [showKey, setShowKey] = useState(false);
  const [serpKeyInput, setSerpKeyInput] = useState('');
  const [serpKeyConfigured, setSerpKeyConfigured] = useState(false);
  const [showSerpKey, setShowSerpKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/ai', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load AI settings.');
      const result = await response.json() as { ai: PublicAi; serpApiKeyConfigured?: boolean };
      setDraft(providerDraft(result.ai));
      setSelected(result.ai.activeProvider);
      setSerpKeyConfigured(Boolean(result.serpApiKeyConfigured));
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load AI settings.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const current = draft?.providers[selected];
  const configuredCount = useMemo(() => draft ? PROVIDERS.filter(({ key }) => draft.providers[key].apiKeyConfigured).length : 0, [draft]);
  const updateCurrent = (field: keyof ProviderDraft, nextValue: string | boolean | number) => {
    setDraft((currentDraft) => currentDraft ? { ...currentDraft, providers: { ...currentDraft.providers, [selected]: { ...currentDraft.providers[selected], [field]: nextValue } } } : currentDraft);
  };

  const request = async (action: 'save' | 'test' | 'reset-cache') => {
    if (!draft) return;
    if (action === 'save') setSaving(true);
    if (action === 'test') setTesting(true);
    if (action === 'reset-cache') setResetting(true);
    setMessage(null);
    try {
      const payload = action === 'reset-cache'
        ? { action }
        : {
            action,
            activeProvider: draft.activeProvider,
            provider: selected,
            providers: draft.providers,
            ...(action === 'save' && serpKeyInput.trim() ? { serpApiKey: serpKeyInput.trim() } : {}),
          };
      const response = await fetch('/api/admin/settings/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json() as { ai?: PublicAi; success?: boolean; message?: string; error?: string };
      if (!response.ok || result.success === false) throw new Error(result.error || 'AI settings request failed.');
      if (result.ai) setDraft(providerDraft(result.ai));
      if (typeof (result as { serpApiKeyConfigured?: boolean }).serpApiKeyConfigured === 'boolean') {
        setSerpKeyConfigured((result as { serpApiKeyConfigured?: boolean }).serpApiKeyConfigured!);
        if (serpKeyInput.trim()) setSerpKeyInput('');
      }
      setMessage({ type: 'success', text: result.message || 'AI settings saved securely.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'AI settings request failed.' });
    } finally {
      setSaving(false);
      setTesting(false);
      setResetting(false);
    }
  };

  if (loading || !draft || !current) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500"><Bot className="h-3.5 w-3.5" /> Platform intelligence</div><h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">AI Settings</h1><p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">Configure server-side AI providers, model fallbacks, limits, and usage tracking.</p></div>
        <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:border-blue-500 hover:text-blue-500" style={{ borderColor: 'var(--border)' }}><RefreshCw className="h-4 w-4" /> Refresh</button><button type="button" disabled={resetting} onClick={() => void request('reset-cache')} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:border-amber-500 hover:text-amber-500 disabled:opacity-60" style={{ borderColor: 'var(--border)' }}><RotateCcw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} /> Reset cache</button><button type="button" disabled={saving} onClick={() => void request('save')} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button></div>
      </div>
      {message && <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'}`}>{message.type === 'success' ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {message.text}</div>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><StatCard label="Active provider" value={PROVIDERS.find(({ key }) => key === draft.activeProvider)?.label} icon={<Bot className="h-4 w-4" />} /><StatCard label="Providers ready" value={`${configuredCount}/4`} icon={<KeyRound className="h-4 w-4" />} /><StatCard label="Requests today" value={draft.usage.dailyRequests} icon={<TestTube2 className="h-4 w-4" />} /><StatCard label="Tokens this month" value={draft.usage.monthlyTokens.toLocaleString()} icon={<ShieldCheck className="h-4 w-4" />} /></div>

      <ContentCard title="Default provider" description="AI generation uses this provider first. The configured fallback model is used by provider-specific integrations." action={<Bot className="h-4 w-4 text-blue-500" />}>
        <label className="block max-w-md"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Active provider</span><select value={draft.activeProvider} onChange={(event) => setDraft({ ...draft, activeProvider: event.target.value as AiProvider })} className={inputClass} style={inputStyle}>{PROVIDERS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}</select></label>
      </ContentCard>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2">
          {PROVIDERS.map(({ key, label, description, color }) => {
            const provider = draft.providers[key];
            return <button type="button" key={key} onClick={() => { setSelected(key); setShowKey(false); }} className={`w-full rounded-xl border p-3 text-left transition ${selected === key ? 'border-blue-500 bg-blue-500/5 shadow-sm' : 'hover:border-blue-500/40'}`} style={{ borderColor: selected === key ? undefined : 'var(--border)', backgroundColor: selected === key ? undefined : 'var(--bg-card)' }}><div className="flex items-center justify-between gap-2"><span className={`text-sm font-bold ${color}`}>{label}</span>{provider.apiKeyConfigured && <Check className="h-4 w-4 text-emerald-500" />}</div><span className="mt-1 block text-[11px] leading-relaxed text-[var(--text-muted)]">{description}</span></button>;
          })}
        </div>

        <ContentCard title={`${PROVIDERS.find(({ key }) => key === selected)?.label} configuration`} description="API keys are encrypted on the server and never returned to the browser." action={<ShieldCheck className="h-4 w-4 text-emerald-500" />}>
          <div className="space-y-5">
            <Toggle checked={current.enabled} onChange={(value) => updateCurrent('enabled', value)} label={`Enable ${PROVIDERS.find(({ key }) => key === selected)?.label}`} description="Allow this provider to be selected for server-side AI requests." />
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> {current.apiKeyConfigured ? 'Encrypted API key is stored securely.' : 'No API key stored yet.'}</div><p className="mt-1 text-emerald-700/80 dark:text-emerald-300/80">Keys are never included in API responses, page props, or browser storage.</p></div>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">API key</span><div className="relative"><input type={showKey ? 'text' : 'password'} value={current.apiKey} onChange={(event) => updateCurrent('apiKey', event.target.value)} placeholder={current.apiKeyConfigured ? 'Enter a new key to replace the stored key' : 'Paste provider API key'} autoComplete="new-password" className={`${inputClass} pr-10`} style={inputStyle} /> <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label={showKey ? 'Hide API key' : 'Show API key'}>{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><span className="mt-1.5 block text-xs text-[var(--text-muted)]">{current.apiKeyConfigured ? 'The existing key remains unchanged when this field is blank.' : 'The key is encrypted before it is written to the database.'}</span></label>
            <div className="grid gap-4 lg:grid-cols-2"><Field label="Default model" value={current.defaultModel} onChange={(value) => updateCurrent('defaultModel', value)} /><Field label="Fallback model" value={current.fallbackModel} onChange={(value) => updateCurrent('fallbackModel', value)} /></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Temperature" type="number" value={current.temperature} onChange={(value) => updateCurrent('temperature', Number(value))} hint="0–2" /><Field label="Max tokens" type="number" value={current.maxTokens} onChange={(value) => updateCurrent('maxTokens', Number(value))} /><Field label="Daily budget" type="number" value={current.dailyBudget} onChange={(value) => updateCurrent('dailyBudget', Number(value))} suffix="USD" /><Field label="Monthly budget" type="number" value={current.monthlyBudget} onChange={(value) => updateCurrent('monthlyBudget', Number(value))} suffix="USD" /></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5" style={{ borderColor: 'var(--border)' }}><span className="text-xs text-[var(--text-muted)]">Test uses the selected provider’s current form values and never displays the key.</span><button type="button" disabled={testing} onClick={() => void request('test')} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:border-blue-500 hover:text-blue-500 disabled:opacity-60" style={{ borderColor: 'var(--border)' }}>{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />} Test connection</button></div>
          </div>
        </ContentCard>
      </div>

      <ContentCard title="SerpAPI — Live Search Data" description="Powers real Google search signals, People Also Ask, trends, and competitor analysis in the Articles Manager 2.0." action={<ShieldCheck className="h-4 w-4 text-emerald-500" />}>
        <div className="space-y-4">
          <div className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-semibold ${serpKeyConfigured ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/25 bg-amber-500/8 text-amber-600 dark:text-amber-400'}`}>
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {serpKeyConfigured ? 'SerpAPI key is stored securely — live search data enabled.' : 'No SerpAPI key configured — articles manager will use free fallback sources only.'}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">SerpAPI key</span>
            <div className="relative">
              <input
                type={showSerpKey ? 'text' : 'password'}
                value={serpKeyInput}
                onChange={(event) => setSerpKeyInput(event.target.value)}
                placeholder={serpKeyConfigured ? 'Enter a new key to replace the stored key' : 'Paste your SerpAPI key'}
                autoComplete="new-password"
                className={`${inputClass} pr-10`}
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowSerpKey(!showSerpKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label={showSerpKey ? 'Hide key' : 'Show key'}>
                {showSerpKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="mt-1.5 block text-xs text-[var(--text-muted)]">
              Stored encrypted server-side, never returned to the browser. Free tier: 100 searches/month at{' '}
              <a href="https://serpapi.com" target="_blank" rel="noreferrer" className="text-blue-500 underline">serpapi.com</a>.
              Saved with the AI settings Save button above.
            </span>
          </label>
        </div>
      </ContentCard>

      <ContentCard title="Usage counter" description="Server-side request and token counters reset automatically by day and month." action={<ShieldCheck className="h-4 w-4 text-blue-500" />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Requests today" value={draft.usage.dailyRequests} /><StatCard label="Tokens today" value={draft.usage.dailyTokens.toLocaleString()} /><StatCard label="Requests this month" value={draft.usage.monthlyRequests} /><StatCard label="Tokens this month" value={draft.usage.monthlyTokens.toLocaleString()} /></div>
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>Budget values are guardrails for configuration and usage visibility. Provider billing remains authoritative.</span></div>
      </ContentCard>
    </div>
  );
}