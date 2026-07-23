'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  Globe2,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Share2,
  TerminalSquare,
  Twitter,
  XCircle,
} from 'lucide-react';
import { ContentCard } from '@/components/admin/Card';
import type { SeoSettings } from '@/lib/types';

type IndexingItem = {
  label: string;
  status: 'Live' | 'Needs setup' | 'Disabled';
  tone: 'healthy' | 'warning' | 'neutral';
};

type SeoResponse = {
  seo: SeoSettings;
  indexing: IndexingItem[];
  summary: { live: number; total: number; verified: boolean };
};

const inputClass =
  'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const inputStyle = { borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };
const helpClass = 'mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]';

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'url';
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
        {maxLength && (
          <span className={`text-[11px] ${value.length > maxLength ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
        style={inputStyle}
      />
      {hint && <p className={helpClass}>{hint}</p>}
    </label>
  );
}

function Textarea({
  label,
  hint,
  value,
  onChange,
  rows = 5,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={`${inputClass} resize-y font-mono text-[12px] leading-relaxed`}
        style={inputStyle}
      />
      {hint && <p className={helpClass}>{hint}</p>}
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border px-3.5 py-3 text-left transition hover:border-blue-500/50"
      style={{ borderColor: 'var(--border)', backgroundColor: checked ? 'rgba(37, 99, 235, 0.06)' : 'var(--bg-input)' }}
      aria-pressed={checked}
    >
      <span>
        <span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
        <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function StatusPill({ item }: { item: IndexingItem }) {
  const live = item.status === 'Live';
  const disabled = item.status === 'Disabled';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
      live ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
      disabled ? 'bg-slate-500/10 text-slate-500' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    }`}>
      {live ? <CheckCircle2 className="h-3.5 w-3.5" /> : disabled ? <XCircle className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
      {item.status}
    </span>
  );
}

export default function SeoPage() {
  const [data, setData] = useState<SeoResponse | null>(null);
  const [form, setForm] = useState<SeoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await fetch('/api/admin/seo', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load SEO settings.');
      const next = (await response.json()) as SeoResponse;
      setData(next);
      setForm(next.seo);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load SEO settings.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const update = <K extends keyof SeoSettings>(key: K, value: SeoSettings[K]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save SEO settings.');
      setMessage({ type: 'success', text: 'SEO settings saved and public outputs refreshed.' });
      await load(true);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save SEO settings.' });
    } finally {
      setSaving(false);
    }
  };

  const customUrlsText = form?.sitemap.customUrls.join('\n') ?? '';
  const characterHints = useMemo(() => ({
    title: form?.metaTitle.length ?? 0,
    description: form?.metaDescription.length ?? 0,
  }), [form?.metaTitle.length, form?.metaDescription.length]);

  if (loading || !form || !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500">
            <Search className="h-3.5 w-3.5" /> Growth tools
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">SEO Center</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            Control how CalculatorFree appears in search, social shares, AI crawlers, and indexing tools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load(true)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500" style={{ borderColor: 'var(--border)' }}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${message.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'}`}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {message.text}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Live outputs</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{data.summary.live}<span className="text-sm font-normal text-[var(--text-muted)]">/{data.summary.total}</span></p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Title length</p>
          <p className={`mt-1 text-2xl font-bold ${characterHints.title > 60 ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>{characterHints.title}<span className="text-sm font-normal text-[var(--text-muted)]">/60</span></p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Description</p>
          <p className={`mt-1 text-2xl font-bold ${characterHints.description > 160 ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>{characterHints.description}<span className="text-sm font-normal text-[var(--text-muted)]">/160</span></p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">GSC</p>
          <p className={`mt-1 text-lg font-bold ${data.summary.verified ? 'text-emerald-500' : 'text-amber-500'}`}>{data.summary.verified ? 'Verified' : 'Not connected'}</p>
        </div>
      </section>

      <ContentCard title="Search appearance" description="The default metadata used by the homepage and shared page shell." action={<Globe2 className="h-4 w-4 text-blue-500" />}>
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Meta title" value={form.metaTitle} maxLength={60} onChange={(value) => update('metaTitle', value)} hint="Aim for 50–60 characters. This becomes the default title in search results." />
          <Field label="Canonical URL" type="url" value={form.canonicalUrl} onChange={(value) => update('canonicalUrl', value)} hint="The preferred site URL. Use the full https:// URL without a trailing path." />
          <div className="lg:col-span-2">
            <label className="block">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Meta description</span>
                <span className={`text-[11px] ${characterHints.description > 160 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{characterHints.description}/160</span>
              </div>
              <textarea value={form.metaDescription} onChange={(event) => update('metaDescription', event.target.value)} rows={3} className={`${inputClass} resize-y`} style={inputStyle} />
              <p className={helpClass}>Aim for 120–160 characters and make the benefit of the site clear.</p>
            </label>
          </div>
        </div>
      </ContentCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard title="OpenGraph" description="Preview controls for Facebook, LinkedIn, and other social cards." action={<Share2 className="h-4 w-4 text-blue-500" />}>
          <div className="space-y-4">
            <Field label="OG title" value={form.openGraph.title} onChange={(value) => update('openGraph', { ...form.openGraph, title: value })} />
            <Field label="OG image URL" type="url" value={form.openGraph.image} onChange={(value) => update('openGraph', { ...form.openGraph, image: value })} hint="Use a 1200 × 630 image for the most consistent preview." />
            <Textarea label="OG description" value={form.openGraph.description} onChange={(value) => update('openGraph', { ...form.openGraph, description: value })} rows={3} />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">OG type</span>
              <select value={form.openGraph.type} onChange={(event) => update('openGraph', { ...form.openGraph, type: event.target.value as 'website' | 'article' })} className={inputClass} style={inputStyle}>
                <option value="website">Website</option><option value="article">Article</option>
              </select>
            </label>
          </div>
        </ContentCard>

        <ContentCard title="Twitter Cards" description="Control how links render when shared on X and compatible clients." action={<Twitter className="h-4 w-4 text-blue-500" />}>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Card type</span>
              <select value={form.twitter.card} onChange={(event) => update('twitter', { ...form.twitter, card: event.target.value as 'summary' | 'summary_large_image' })} className={inputClass} style={inputStyle}>
                <option value="summary_large_image">Summary with large image</option><option value="summary">Summary</option>
              </select>
            </label>
            <Field label="Twitter title" value={form.twitter.title} onChange={(value) => update('twitter', { ...form.twitter, title: value })} />
            <Field label="Twitter image URL" type="url" value={form.twitter.image} onChange={(value) => update('twitter', { ...form.twitter, image: value })} />
            <Textarea label="Twitter description" value={form.twitter.description} onChange={(value) => update('twitter', { ...form.twitter, description: value })} rows={3} />
          </div>
        </ContentCard>
      </div>

      <ContentCard title="Structured data" description="JSON-LD injected into the root layout. Invalid JSON is rejected on save." action={<FileCode2 className="h-4 w-4 text-blue-500" />}>
        <Textarea label="JSON-LD document" value={form.jsonLd} onChange={(value) => update('jsonLd', value)} rows={10} hint="Use valid schema.org JSON. Page-specific calculator schemas remain generated by the calculator pages." />
      </ContentCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard title="Sitemap" description="Choose which URL groups are submitted to search engines." action={<Link2 className="h-4 w-4 text-blue-500" />}>
          <div className="space-y-3">
            <Toggle label="Enable XML sitemap" description="Serve the machine-readable sitemap at /sitemap.xml." checked={form.sitemap.enabled} onChange={(value) => update('sitemap', { ...form.sitemap, enabled: value })} />
            <Toggle label="Include static pages" description="Include home, about, privacy, terms, and contact pages." checked={form.sitemap.includeStaticPages} onChange={(value) => update('sitemap', { ...form.sitemap, includeStaticPages: value })} />
            <Toggle label="Include calculators" description="Include every built-in calculator page." checked={form.sitemap.includeCalculators} onChange={(value) => update('sitemap', { ...form.sitemap, includeCalculators: value })} />
            <label className="block pt-2">
              <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Additional URLs</span>
              <textarea value={customUrlsText} onChange={(event) => update('sitemap', { ...form.sitemap, customUrls: event.target.value.split('\n').map((url) => url.trim()).filter(Boolean) })} rows={4} placeholder="https://example.com/special-page" className={`${inputClass} resize-y font-mono text-xs`} style={inputStyle} />
              <p className={helpClass}>One absolute URL per line.</p>
            </label>
          </div>
        </ContentCard>

        <ContentCard title="Robots" description="Crawler directives served from /robots.txt." action={<TerminalSquare className="h-4 w-4 text-blue-500" />}>
          <div className="space-y-3">
            <Toggle label="Enable robots.txt" description="Allow the editable crawler policy to be served publicly." checked={form.robots.enabled} onChange={(value) => update('robots', { ...form.robots, enabled: value })} />
            <Textarea label="Robots content" value={form.robots.content} onChange={(value) => update('robots', { ...form.robots, content: value })} rows={8} hint="Keep a Sitemap directive here if you want crawlers to discover the XML sitemap." />
          </div>
        </ContentCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCard title="RSS feed" description="Manage the channel metadata at /rss.xml." action={<Share2 className="h-4 w-4 text-blue-500" />}>
          <div className="space-y-4">
            <Toggle label="Enable RSS" description="Publish the calculator feed for RSS readers." checked={form.rss.enabled} onChange={(value) => update('rss', { ...form.rss, enabled: value })} />
            <Field label="Feed title" value={form.rss.title} onChange={(value) => update('rss', { ...form.rss, title: value })} />
            <Textarea label="Feed description" value={form.rss.description} onChange={(value) => update('rss', { ...form.rss, description: value })} rows={3} />
          </div>
        </ContentCard>

        <ContentCard title="llms.txt" description="AI-readable site guidance served at /llms.txt." action={<FileCode2 className="h-4 w-4 text-blue-500" />}>
          <div className="space-y-3">
            <Toggle label="Enable llms.txt" description="Publish the editable AI crawler overview." checked={form.llmsTxt.enabled} onChange={(value) => update('llmsTxt', { ...form.llmsTxt, enabled: value })} />
            <Textarea label="llms.txt content" value={form.llmsTxt.content} onChange={(value) => update('llmsTxt', { ...form.llmsTxt, content: value })} rows={10} />
          </div>
        </ContentCard>
      </div>

      <ContentCard title="Google Search Console" description="Add verification and keep the property visible to the team." action={<Search className="h-4 w-4 text-blue-500" />}>
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Property URL" type="url" value={form.googleSearchConsole.propertyUrl} onChange={(value) => update('googleSearchConsole', { ...form.googleSearchConsole, propertyUrl: value })} placeholder="https://calculatorfree.vercel.app" hint="The property you manage in Google Search Console." />
          <Field label="Google verification code" value={form.googleSearchConsole.verificationCode} onChange={(value) => update('googleSearchConsole', { ...form.googleSearchConsole, verificationCode: value })} hint="The token from the HTML tag verification method. It is added to the page metadata after saving." />
        </div>
      </ContentCard>

      <ContentCard title="Indexing status" description="Current configuration status for the public SEO surfaces." action={<Settings2 className="h-4 w-4 text-blue-500" />}>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {data.indexing.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {item.label === 'Google Search Console' ? (data.summary.verified ? 'Verification metadata is configured.' : 'Add a verification token to connect this property.') : `Public ${item.label} output is ${item.status === 'Live' ? 'available' : item.status.toLowerCase()}.`}
                </p>
              </div>
              <StatusPill item={item} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          {[
            ['/sitemap.xml', 'Sitemap'],
            ['/robots.txt', 'Robots'],
            ['/rss.xml', 'RSS'],
            ['/llms.txt', 'llms.txt'],
          ].map(([href, label]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-blue-500 transition hover:border-blue-500" style={{ borderColor: 'var(--border)' }}>
              {label} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </ContentCard>
    </div>
  );
}