'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Clock,
  FileText,
  Tag,
  Link2,
  Code2,
  HelpCircle,
  ListOrdered,
  Globe,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Hash,
  Image as ImageIcon,
  Twitter,
  Heading1,
  AlignLeft,
  BarChart2,
} from 'lucide-react';
import type { Article } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'content' | 'seo-engine' | 'seo' | 'opengraph' | 'schema' | 'faq' | 'howto' | 'related';

interface SeoPackage {
  seoTitle: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
  schemaArticle: string;
  schemaFaq: string | null;
  schemaBreadcrumb: string;
  schemaHowTo: string | null;
  readingTime: number;
  wordCount: number;
  lastUpdated: string;
  tableOfContents: string;
  h1: string;
  headingHierarchy: { level: 'h2' | 'h3'; text: string; id: string }[];
  focusKeyword: string;
  aiUsed: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-zinc-500/15 text-zinc-400',
    pending_review: 'bg-amber-500/15 text-amber-400',
    published: 'bg-emerald-500/15 text-emerald-400',
  };
  const label: Record<string, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    published: 'Published',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? ''}`}>
      {label[status] ?? status}
    </span>
  );
}

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'seo-engine', label: 'SEO Engine', icon: Sparkles },
  { key: 'seo', label: 'Meta Tags', icon: Tag },
  { key: 'opengraph', label: 'OpenGraph', icon: Globe },
  { key: 'schema', label: 'Schema', icon: Code2 },
  { key: 'faq', label: 'FAQ', icon: HelpCircle },
  { key: 'howto', label: 'How-To', icon: ListOrdered },
  { key: 'related', label: 'Related', icon: Link2 },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[var(--text-primary)] block">{label}</label>
      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
      {children}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  rows = 6,
  mono = false,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${mono ? 'font-mono' : ''}`}
      style={{ borderColor: 'var(--border)' }}
    />
  );
}

function Input({
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${mono ? 'font-mono' : ''}`}
      style={{ borderColor: 'var(--border)' }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('content');

  // Editable fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'pending_review' | 'published'>('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogUrl, setOgUrl] = useState('');
  const [ogType, setOgType] = useState('article');
  const [schemaFaq, setSchemaFaq] = useState('');
  const [schemaArticle, setSchemaArticle] = useState('');
  const [schemaHowTo, setSchemaHowTo] = useState('');
  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([]);
  const [howToSteps, setHowToSteps] = useState<string[]>([]);
  const [relatedCalculators, setRelatedCalculators] = useState<string[]>([]);
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);
  const [tableOfContents, setTableOfContents] = useState('');
  // SEO Engine state
  const [ogImage, setOgImage] = useState('');
  const [twitterCard, setTwitterCard] = useState<'summary' | 'summary_large_image'>('summary_large_image');
  const [schemaBreadcrumb, setSchemaBreadcrumb] = useState('');
  const [headingHierarchy, setHeadingHierarchy] = useState<{ level: 'h2' | 'h3'; text: string; id: string }[]>([]);
  const [seoReadingTime, setSeoReadingTime] = useState<number | ''>('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [seoGenError, setSeoGenError] = useState('');
  const [seoGenSuccess, setSeoGenSuccess] = useState(false);
  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({});

  // ─── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/articles/${id}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Not found');
      }
      const data: Article = await res.json();
      setArticle(data);
      setTitle(data.title);
      setSlug(data.slug);
      setContent(data.content);
      setStatus(data.status);
      setSeoTitle(data.seoData.title);
      setSeoDescription(data.seoData.description);
      setSeoKeywords((data.seoData.keywords || []).join(', '));
      setCanonicalUrl(data.seoData.canonicalUrl);
      setOgTitle(data.openGraph?.title || data.seoData.title);
      setOgDescription(data.openGraph?.description || data.seoData.description);
      setOgUrl(data.openGraph?.url || `/blog/${data.slug}`);
      setOgType(data.openGraph?.type || 'article');
      setSchemaFaq(data.schemaFaq || '');
      setSchemaArticle(data.schemaArticle || '');
      setSchemaHowTo(data.schemaHowTo || '');
      setFaqItems(data.faqItems || []);
      setHowToSteps(data.howToSteps || []);
      setRelatedCalculators(data.relatedCalculators || []);
      setRelatedKeywords(data.relatedKeywords || []);
      setTableOfContents(data.tableOfContents || '');
      // SEO Engine fields
      setOgImage(data.ogImage || '');
      setTwitterCard(data.twitterCard || 'summary_large_image');
      setSchemaBreadcrumb(data.schemaBreadcrumb || '');
      setHeadingHierarchy(data.headingHierarchy || []);
      setSeoReadingTime(data.readingTime ?? '');
      setFocusKeyword(data.keywordData?.keyword || data.seoData?.keywords?.[0] || '');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const keywords = seoKeywords.split(',').map((k) => k.trim()).filter(Boolean);
      const payload: Partial<Article> = {
        title,
        slug,
        content,
        status,
        seoData: {
          title: seoTitle,
          description: seoDescription,
          keywords,
          canonicalUrl,
        },
        openGraph: { title: ogTitle, description: ogDescription, url: ogUrl, type: ogType },
        schemaFaq,
        schemaArticle,
        schemaHowTo,
        schemaBreadcrumb,
        faqItems,
        howToSteps,
        relatedCalculators,
        relatedKeywords,
        tableOfContents,
        ogImage,
        twitterCard,
        headingHierarchy,
        ...(seoReadingTime !== '' ? { readingTime: Number(seoReadingTime) } : {}),
      };
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setArticle(data.article);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── SEO Generate ─────────────────────────────────────────────────────────

  const handleGenerateSeo = useCallback(async () => {
    setSeoGenerating(true);
    setSeoGenError('');
    setSeoGenSuccess(false);
    try {
      const res = await fetch(`/api/admin/articles/${id}/generate-seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusKeyword: focusKeyword.trim() }),
      });
      const data = await res.json() as { success?: boolean; seo?: SeoPackage; error?: string };
      if (!res.ok || !data.success || !data.seo) {
        throw new Error(data.error || 'Generation failed');
      }
      const seo = data.seo;
      // Apply to editor state
      setSeoTitle(seo.seoTitle);
      setSeoDescription(seo.metaDescription);
      setCanonicalUrl(seo.canonicalUrl);
      setOgTitle(seo.ogTitle);
      setOgDescription(seo.ogDescription);
      setOgImage(seo.ogImage);
      setTwitterCard(seo.twitterCard);
      if (seo.schemaArticle) setSchemaArticle(seo.schemaArticle);
      if (seo.schemaFaq) setSchemaFaq(seo.schemaFaq);
      if (seo.schemaBreadcrumb) setSchemaBreadcrumb(seo.schemaBreadcrumb);
      if (seo.schemaHowTo) setSchemaHowTo(seo.schemaHowTo);
      setSeoReadingTime(seo.readingTime);
      if (seo.tableOfContents) setTableOfContents(seo.tableOfContents);
      setHeadingHierarchy(seo.headingHierarchy);
      setSeoGenSuccess(true);
      setTimeout(() => setSeoGenSuccess(false), 4000);
    } catch (e: unknown) {
      setSeoGenError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setSeoGenerating(false);
    }
  }, [id, focusKeyword]);

  // ─── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-muted)] text-sm gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading article…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => router.push('/admin/articles')}
          className="text-xs text-blue-400 hover:underline"
        >
          ← Back to articles
        </button>
      </div>
    );
  }
  if (!article) return null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/articles')}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] line-clamp-1">{title || 'Article Editor'}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <StatusBadge status={status} />
              {article.readingTime && (
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {article.readingTime} min read
                </span>
              )}
              {article.wordCount && (
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {article.wordCount.toLocaleString()} words
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)] font-mono">/blog/{slug}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/blog/${article.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-emerald-400 hover:bg-emerald-600/10 transition"
            title="Preview article"
          >
            <Eye className="w-4 h-4" />
          </a>

          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="published">Published</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Save feedback */}
      {saved && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Changes saved successfully.
        </div>
      )}
      {saveError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {saveError}
        </div>
      )}

      {/* Title & Slug always visible */}
      <div
        className="rounded-xl border p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <Field label="Title">
          <Input value={title} onChange={setTitle} placeholder="Article title…" />
        </Field>
        <Field label="URL Slug" hint="The URL path: /blog/{slug}">
          <Input
            value={slug}
            onChange={(v) => setSlug(v.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="url-slug"
            mono
          />
        </Field>
      </div>

      {/* Keyword data chip row */}
      {article.keywordData && (
        <div
          className="rounded-xl border px-5 py-3 flex flex-wrap gap-4 items-center"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          <span className="text-xs text-[var(--text-muted)] font-medium">Keyword data:</span>
          <span className="text-xs font-mono text-blue-400">{article.keywordData.keyword}</span>
          {article.keywordData.searchVolume && (
            <span className="text-xs text-[var(--text-muted)]">📊 {article.keywordData.searchVolume}/mo</span>
          )}
          {article.keywordData.competition && (
            <span className="text-xs text-[var(--text-muted)] capitalize">
              Competition: <strong className="text-[var(--text-primary)]">{article.keywordData.competition}</strong>
            </span>
          )}
          {article.keywordData.difficulty !== undefined && (
            <span className="text-xs text-[var(--text-muted)]">
              Difficulty: <strong className="text-[var(--text-primary)]">{article.keywordData.difficulty}/100</strong>
            </span>
          )}
          {article.keywordData.opportunityScore !== undefined && (
            <span className="text-xs text-[var(--text-muted)]">
              Opportunity: <strong className="text-emerald-400">{article.keywordData.opportunityScore}/100</strong>
            </span>
          )}
          {article.keywordData.trend && (
            <span className="text-xs text-[var(--text-muted)] capitalize">
              Trend: <strong className="text-[var(--text-primary)]">{article.keywordData.trend}</strong>
            </span>
          )}
          {article.keywordData.estimatedCtr && (
            <span className="text-xs text-emerald-400">Est. CTR: {article.keywordData.estimatedCtr}</span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        {/* Tab bar */}
        <div
          className="flex overflow-x-auto border-b"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition border-b-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5 space-y-5">

          {/* ── SEO ENGINE ── */}
          {activeTab === 'seo-engine' && (
            <div className="space-y-6">

              {/* Generation panel */}
              <div
                className="rounded-xl border p-5 space-y-4"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Auto-Generate SEO Fields</h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Enter your focus keyword and click Generate. All fields below will be populated from your article title, content, and keyword — no placeholder values.
                </p>
                <div className="flex gap-2">
                  <input
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="Focus keyword (e.g. mortgage calculator)"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border)' }}
                    onKeyDown={(e) => e.key === 'Enter' && !seoGenerating && handleGenerateSeo()}
                  />
                  <button
                    onClick={handleGenerateSeo}
                    disabled={seoGenerating || !focusKeyword.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
                  >
                    {seoGenerating
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Generate All</>}
                  </button>
                </div>
                {seoGenError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {seoGenError}
                  </div>
                )}
                {seoGenSuccess && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> All SEO fields generated. Review and edit below, then Save Changes.
                  </div>
                )}
              </div>

              {/* ── SECTION: Core Meta Tags ── */}
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Core Meta Tags
                </p>
              </div>

              {/* H1 */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Heading1 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <label className="text-xs font-semibold text-[var(--text-primary)]">H1 — Article Heading</label>
                  <span className="text-xs text-[var(--text-muted)] ml-auto">Derived from Title — edit in header</span>
                </div>
                <div
                  className="w-full px-3 py-2 text-sm rounded-lg border text-[var(--text-muted)] select-none"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
                >
                  {title || <span className="italic opacity-50">No title set</span>}
                </div>
              </div>

              {/* SEO Title */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">SEO Title</label>
                  <span className={`text-xs ml-auto font-mono ${seoTitle.length > 60 ? 'text-amber-400' : seoTitle.length >= 50 ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                    {seoTitle.length}/60
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Target 50–60 characters. Include focus keyword near the start.</p>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="SEO-optimized title for search results…"
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border)' }}
                />
                {/* SERP preview */}
                <div className="rounded-lg border p-3 text-xs space-y-0.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
                  <p className="text-[#1a0dab] font-medium truncate">{seoTitle || 'SEO Title'} | CalculatorFree</p>
                  <p className="text-[#006621] font-mono truncate opacity-80">calculatorfree.com/blog/{slug}</p>
                  <p className="text-[var(--text-muted)] line-clamp-2 leading-relaxed">{seoDescription || 'Meta description will appear here.'}</p>
                </div>
              </div>

              {/* Meta Description */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">Meta Description</label>
                  <span className={`text-xs ml-auto font-mono ${seoDescription.length > 155 ? 'text-amber-400' : seoDescription.length >= 140 ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                    {seoDescription.length}/155
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Target 140–155 characters. Include focus keyword and a clear value prop.</p>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  placeholder="Compelling meta description that includes focus keyword and drives clicks…"
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              {/* Canonical URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Canonical URL
                </label>
                <input
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="/blog/article-slug"
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              {/* ── SECTION: OpenGraph + Twitter ── */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> OpenGraph &amp; Twitter Card
                </p>
              </div>

              {/* OG Preview */}
              <div className="rounded-xl border overflow-hidden max-w-sm" style={{ borderColor: 'var(--border)' }}>
                <div
                  className="h-14 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]"
                  style={{ backgroundColor: 'var(--bg-card-hover)' }}
                >
                  <ImageIcon className="w-4 h-4" />
                  {ogImage ? <span className="font-mono truncate px-2 text-xs">{ogImage}</span> : 'OG Image'}
                </div>
                <div className="p-3 space-y-0.5" style={{ backgroundColor: 'var(--bg-card)' }}>
                  <p className="text-xs text-[var(--text-muted)] font-mono truncate">calculatorfree.vercel.app</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">{ogTitle || seoTitle || 'OG Title'}</p>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">{ogDescription || seoDescription || 'OG Description'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">OG Title</label>
                    <span className={`text-xs ml-auto font-mono ${ogTitle.length > 80 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>{ogTitle.length}/80</span>
                  </div>
                  <input
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="OpenGraph title for social sharing…"
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Twitter className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Twitter Card
                  </label>
                  <select
                    value={twitterCard}
                    onChange={(e) => setTwitterCard(e.target.value as 'summary' | 'summary_large_image')}
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <option value="summary_large_image">summary_large_image (large card)</option>
                    <option value="summary">summary (small card)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">OG Description</label>
                  <span className={`text-xs ml-auto font-mono ${ogDescription.length > 125 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>{ogDescription.length}/125</span>
                </div>
                <textarea
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  rows={2}
                  placeholder="OpenGraph description for social sharing…"
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" /> OG Image URL
                </label>
                <p className="text-xs text-[var(--text-muted)]">Full URL to the OpenGraph image (1200×630px recommended). Leave blank to use the site default.</p>
                <input
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="/og-image.png"
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              {/* ── SECTION: Structured Data ── */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> JSON-LD Structured Data
                </p>
                <p className="text-xs text-[var(--text-muted)]">Injected into the article page head as <code className="font-mono bg-[var(--bg-card-hover)] px-1 rounded">{'<script type="application/ld+json">'}</code>.</p>
              </div>

              {/* Article Schema */}
              {[
                { key: 'article', label: 'Article Schema', hint: 'schema.org/Article', value: schemaArticle, set: setSchemaArticle },
                { key: 'faq', label: 'FAQ Schema', hint: 'schema.org/FAQPage', value: schemaFaq, set: setSchemaFaq },
                { key: 'breadcrumb', label: 'Breadcrumb Schema', hint: 'schema.org/BreadcrumbList', value: schemaBreadcrumb, set: setSchemaBreadcrumb },
                { key: 'howto', label: 'HowTo Schema', hint: 'schema.org/HowTo', value: schemaHowTo, set: setSchemaHowTo },
              ].map(({ key, label, hint, value, set }) => (
                <div key={key} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedSchemas((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                  >
                    <span className="flex items-center gap-2 font-medium text-xs">
                      <Code2 className="w-3.5 h-3.5 text-blue-400" />
                      {label}
                      <span className="text-[var(--text-muted)] font-normal">{hint}</span>
                      {value && <span className="rounded-full bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5 ml-1">✓ set</span>}
                      {!value && <span className="rounded-full bg-zinc-500/15 text-zinc-400 text-xs px-2 py-0.5 ml-1">empty</span>}
                    </span>
                    {expandedSchemas[key]
                      ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                      : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                  </button>
                  {expandedSchemas[key] && (
                    <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
                      <textarea
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        rows={10}
                        placeholder={`{"@context": "https://schema.org", "@type": "...", …}`}
                        className="w-full px-3 py-2 text-xs rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      {value && (() => {
                        try { JSON.parse(value); return <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid JSON</p>; }
                        catch { return <p className="text-xs text-amber-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Invalid JSON — will not be injected</p>; }
                      })()}
                    </div>
                  )}
                </div>
              ))}

              {/* ── SECTION: Content Structure ── */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Content Structure
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Reading Time',
                    icon: <Clock className="w-4 h-4 text-blue-400" />,
                    editable: true,
                    value: seoReadingTime,
                    onChange: (v: string) => setSeoReadingTime(v === '' ? '' : Number(v)),
                    suffix: 'min',
                  },
                  {
                    label: 'Word Count',
                    icon: <FileText className="w-4 h-4 text-purple-400" />,
                    editable: false,
                    display: content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length.toLocaleString(),
                    suffix: 'words',
                  },
                  {
                    label: 'H2 Headings',
                    icon: <BarChart2 className="w-4 h-4 text-emerald-400" />,
                    editable: false,
                    display: String(headingHierarchy.filter((h) => h.level === 'h2').length),
                    suffix: '',
                  },
                  {
                    label: 'H3 Headings',
                    icon: <Hash className="w-4 h-4 text-orange-400" />,
                    editable: false,
                    display: String(headingHierarchy.filter((h) => h.level === 'h3').length),
                    suffix: '',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border p-3 space-y-1"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
                  >
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      {stat.icon} {stat.label}
                    </div>
                    {stat.editable ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={stat.value as number | ''}
                          onChange={(e) => (stat.onChange as (v: string) => void)(e.target.value)}
                          className="w-16 px-2 py-1 text-sm font-semibold rounded border bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                          style={{ borderColor: 'var(--border)' }}
                        />
                        <span className="text-xs text-[var(--text-muted)]">{stat.suffix}</span>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-[var(--text-primary)]">
                        {stat.display} {stat.suffix && <span className="text-xs font-normal text-[var(--text-muted)]">{stat.suffix}</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Last Updated */}
              {article.updatedAt && (
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Last updated: {new Date(article.updatedAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* Heading Hierarchy */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setExpandedSchemas((prev) => ({ ...prev, headings: !prev.headings }))}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Hash className="w-3.5 h-3.5 text-blue-400" />
                    Heading Hierarchy
                    <span className="text-[var(--text-muted)] font-normal">
                      H2 × {headingHierarchy.filter((h) => h.level === 'h2').length} &nbsp;·&nbsp; H3 × {headingHierarchy.filter((h) => h.level === 'h3').length}
                    </span>
                  </span>
                  {expandedSchemas.headings
                    ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                </button>
                {expandedSchemas.headings && (
                  <div className="border-t p-4 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                    {headingHierarchy.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic">No headings detected. Generate SEO to extract the heading tree from your content.</p>
                    ) : (
                      headingHierarchy.map((h, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 text-xs py-1 ${h.level === 'h3' ? 'pl-5' : ''}`}
                        >
                          <span className={`font-mono font-bold shrink-0 ${h.level === 'h2' ? 'text-blue-400' : 'text-purple-400'}`}>
                            {h.level.toUpperCase()}
                          </span>
                          <span className="text-[var(--text-secondary)] leading-relaxed">{h.text}</span>
                          {h.id && (
                            <span className="font-mono text-[var(--text-muted)] opacity-60 ml-auto shrink-0">#{h.id}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Table of Contents */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setExpandedSchemas((prev) => ({ ...prev, toc: !prev.toc }))}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    Table of Contents HTML
                    {tableOfContents
                      ? <span className="rounded-full bg-emerald-500/15 text-emerald-400 text-xs px-2 py-0.5">✓ set</span>
                      : <span className="rounded-full bg-zinc-500/15 text-zinc-400 text-xs px-2 py-0.5">empty</span>}
                  </span>
                  {expandedSchemas.toc
                    ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                </button>
                {expandedSchemas.toc && (
                  <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
                    <textarea
                      value={tableOfContents}
                      onChange={(e) => setTableOfContents(e.target.value)}
                      rows={8}
                      placeholder='<nav class="toc-box" aria-label="Table of Contents">…</nav>'
                      className="w-full px-3 py-2 text-xs rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ── CONTENT ── */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  HTML Content
                </p>
                <span className="text-xs text-[var(--text-muted)]">
                  {content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </span>
              </div>
              <Textarea
                value={content}
                onChange={setContent}
                rows={30}
                mono
                placeholder="Article HTML content…"
              />
            </div>
          )}

          {/* ── SEO ── */}
          {activeTab === 'seo' && (
            <div className="space-y-5">
              <Field label="Meta Title" hint={`${seoTitle.length}/60 characters recommended`}>
                <Input value={seoTitle} onChange={setSeoTitle} placeholder="SEO page title…" />
              </Field>
              <Field label="Meta Description" hint={`${seoDescription.length}/155 characters recommended`}>
                <Textarea value={seoDescription} onChange={setSeoDescription} rows={3} placeholder="150-155 char meta description…" />
              </Field>
              <Field label="Keywords" hint="Comma-separated list of target keywords">
                <Textarea
                  value={seoKeywords}
                  onChange={setSeoKeywords}
                  rows={3}
                  placeholder="mortgage calculator, home loan, monthly payment…"
                />
              </Field>
              <Field label="Canonical URL">
                <Input value={canonicalUrl} onChange={setCanonicalUrl} placeholder="/blog/article-slug" mono />
              </Field>
              <Field label="Related Keywords">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {relatedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-600/10 text-blue-400 border border-blue-600/20"
                    >
                      {kw}
                      <button
                        onClick={() => setRelatedKeywords((prev) => prev.filter((k) => k !== kw))}
                        className="hover:text-red-400 transition ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Textarea
                  value={relatedKeywords.join('\n')}
                  onChange={(v) => setRelatedKeywords(v.split('\n').map((k) => k.trim()).filter(Boolean))}
                  rows={4}
                  placeholder="One keyword per line…"
                />
              </Field>
            </div>
          )}

          {/* ── OPENGRAPH ── */}
          {activeTab === 'opengraph' && (
            <div className="space-y-5">
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
              >
                <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Preview (approximate)</p>
                <div className="rounded-lg border overflow-hidden max-w-md" style={{ borderColor: 'var(--border)' }}>
                  <div className="h-8 flex items-center justify-center text-xs text-[var(--text-muted)]" style={{ backgroundColor: 'var(--bg-card)' }}>
                    Open Graph Image
                  </div>
                  <div className="p-3" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <p className="text-xs text-[var(--text-muted)] font-mono">{ogUrl}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 line-clamp-1">{ogTitle}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{ogDescription}</p>
                  </div>
                </div>
              </div>
              <Field label="OG Title">
                <Input value={ogTitle} onChange={setOgTitle} placeholder="Open Graph title…" />
              </Field>
              <Field label="OG Description">
                <Textarea value={ogDescription} onChange={setOgDescription} rows={3} placeholder="Open Graph description…" />
              </Field>
              <Field label="OG URL">
                <Input value={ogUrl} onChange={setOgUrl} placeholder="/blog/slug" mono />
              </Field>
              <Field label="OG Type">
                <select
                  value={ogType}
                  onChange={(e) => setOgType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <option value="article">article</option>
                  <option value="website">website</option>
                </select>
              </Field>
            </div>
          )}

          {/* ── SCHEMA ── */}
          {activeTab === 'schema' && (
            <div className="space-y-5">
              <p className="text-xs text-[var(--text-muted)]">
                JSON-LD structured data schemas. Edit the JSON directly. These are embedded in the article as{' '}
                <code className="font-mono bg-[var(--bg-card-hover)] px-1 rounded">{'<script type="application/ld+json">'}</code>.
              </p>
              <Field label="Article Schema (schema.org/Article)">
                <Textarea value={schemaArticle} onChange={setSchemaArticle} rows={12} mono placeholder='{"@context": "https://schema.org", "@type": "Article", …}' />
              </Field>
              <Field label="FAQ Schema (schema.org/FAQPage)">
                <Textarea value={schemaFaq} onChange={setSchemaFaq} rows={12} mono placeholder='{"@context": "https://schema.org", "@type": "FAQPage", …}' />
              </Field>
              <Field label="HowTo Schema (schema.org/HowTo)">
                <Textarea value={schemaHowTo} onChange={setSchemaHowTo} rows={10} mono placeholder='{"@context": "https://schema.org", "@type": "HowTo", …}' />
              </Field>
            </div>
          )}

          {/* ── FAQ ── */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">FAQ Items ({faqItems.length})</p>
                <button
                  onClick={() => setFaqItems((prev) => [...prev, { q: '', a: '' }])}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  + Add FAQ
                </button>
              </div>
              {faqItems.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-[var(--text-muted)]">
                  <HelpCircle className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No FAQ items. Add one above.</p>
                </div>
              )}
              {faqItems.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-4 space-y-3"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-muted)]">FAQ #{i + 1}</span>
                    <button
                      onClick={() => setFaqItems((prev) => prev.filter((_, j) => j !== i))}
                      className="text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Remove
                    </button>
                  </div>
                  <Field label="Question">
                    <Input
                      value={item.q}
                      onChange={(v) => setFaqItems((prev) => prev.map((f, j) => j === i ? { ...f, q: v } : f))}
                      placeholder="What is…?"
                    />
                  </Field>
                  <Field label="Answer">
                    <Textarea
                      value={item.a}
                      onChange={(v) => setFaqItems((prev) => prev.map((f, j) => j === i ? { ...f, a: v } : f))}
                      rows={3}
                      placeholder="The answer…"
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {/* ── HOW-TO ── */}
          {activeTab === 'howto' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">How-To Steps ({howToSteps.length})</p>
                <button
                  onClick={() => setHowToSteps((prev) => [...prev, ''])}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  + Add Step
                </button>
              </div>
              {howToSteps.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-[var(--text-muted)]">
                  <ListOrdered className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No steps yet. Add one above.</p>
                </div>
              )}
              {howToSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0 mt-1"
                    style={{ backgroundColor: 'var(--bg-card-hover)' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={step}
                      onChange={(v) => setHowToSteps((prev) => prev.map((s, j) => j === i ? v : s))}
                      rows={2}
                      placeholder={`Step ${i + 1}…`}
                    />
                  </div>
                  <button
                    onClick={() => setHowToSteps((prev) => prev.filter((_, j) => j !== i))}
                    className="mt-1 text-xs text-red-400 hover:text-red-300 transition flex-shrink-0 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── RELATED ── */}
          {activeTab === 'related' && (
            <div className="space-y-5">
              <Field label="Related Calculators" hint="Slug names of related calculators, one per line">
                <Textarea
                  value={relatedCalculators.join('\n')}
                  onChange={(v) => setRelatedCalculators(v.split('\n').map((k) => k.trim()).filter(Boolean))}
                  rows={6}
                  placeholder="mortgage&#10;bmi&#10;loan"
                  mono
                />
              </Field>
              {relatedCalculators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {relatedCalculators.map((slug) => (
                    <a
                      key={slug}
                      href={`/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-600/10 text-blue-400 border border-blue-600/20 hover:bg-blue-600/20 transition"
                    >
                      <BookOpen className="w-2.5 h-2.5" />
                      /{slug}
                    </a>
                  ))}
                </div>
              )}
              <Field label="Table of Contents HTML" hint="Raw HTML for the table of contents block">
                <Textarea
                  value={tableOfContents}
                  onChange={setTableOfContents}
                  rows={8}
                  mono
                  placeholder='<nav class="toc-box">…</nav>'
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* Bottom save bar */}
      <div
        className="sticky bottom-0 rounded-xl border px-5 py-3 flex items-center justify-between gap-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          {article.version && <span>Version {article.version}</span>}
          {article.updatedAt && (
            <span>
              Last saved:{' '}
              {new Date(article.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Saved
            </span>
          )}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="published">Published</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
