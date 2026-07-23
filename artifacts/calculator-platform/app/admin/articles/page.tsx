'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Lock,
  Pencil,
  RefreshCw,
  Send,
  Wand2,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import type { Article } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'title' | 'keyword' | 'slug' | 'generate' | 'save';
type WorkflowAction = 'draft' | 'review' | 'publish';
type Working = 'titles' | 'keywords' | 'slug' | 'generate' | WorkflowAction | null;
type NoticeKind = 'success' | 'error' | 'info';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function statusLabel(status: Article['status']) {
  if (status === 'pending_review') return 'Pending Review';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusBadge(status: Article['status']) {
  const map: Record<Article['status'], string> = {
    published: 'bg-emerald-500/10 text-emerald-500',
    pending_review: 'bg-amber-500/10 text-amber-500',
    draft: 'bg-slate-500/10 text-[var(--text-muted)]',
  };
  return map[status] ?? map.draft;
}

// ─── Small components ─────────────────────────────────────────────────────────

function Notice({ kind, children }: { kind: NoticeKind; children: React.ReactNode }) {
  const map: Record<NoticeKind, { cls: string; Icon: typeof Info }> = {
    success: { cls: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400', Icon: CheckCircle2 },
    error:   { cls: 'border-red-500/25 bg-red-500/8 text-red-600 dark:text-red-400', Icon: XCircle },
    info:    { cls: 'border-blue-500/25 bg-blue-500/8 text-blue-600 dark:text-blue-400', Icon: Info },
  };
  const { cls, Icon } = map[kind];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <span className="block text-xs font-semibold text-[var(--text-secondary)]">{children}</span>
      {hint && <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{hint}</span>}
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  locked,
  children,
}: {
  number: string;
  title: string;
  description: string;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border transition-opacity ${locked ? 'opacity-55 pointer-events-none select-none' : ''}`}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
    >
      <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-500">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
        </div>
        {locked && <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

function GhostButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ borderColor: 'var(--border)' }}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

const inputCls =
  'w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const inputStyle = {
  borderColor: 'var(--border)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArticlesPage() {
  // Composer state
  const [title, setTitle] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [liveDataUsed, setLiveDataUsed] = useState<boolean | null>(null);

  const [focusKeyword, setFocusKeyword] = useState('');
  const [keywordLocked, setKeywordLocked] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);

  const [slug, setSlug] = useState('');

  const [article, setArticle] = useState<Article | null>(null);
  const [generationStage, setGenerationStage] = useState('');

  const [working, setWorking] = useState<Working>(null);
  const [notice, setNotice] = useState<{ kind: NoticeKind; text: string } | null>(null);

  // Saved articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // Derived
  const hasTitle = title.trim().length > 0;
  const hasKeyword = focusKeyword.trim().length > 0 && keywordLocked;
  const hasSlug = slug.trim().length > 0;
  const canGenerate = hasTitle && hasKeyword && hasSlug && !article;

  const duplicateKeyword = useMemo(
    () =>
      Boolean(
        focusKeyword.trim() &&
          articles.some((a) =>
            (a.seoData.keywords ?? []).some(
              (k) => k.toLowerCase() === focusKeyword.trim().toLowerCase(),
            ),
          ),
      ),
    [articles, focusKeyword],
  );

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch('/api/admin/blog', { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load saved articles.');
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Unable to load saved articles.' });
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => { void loadArticles(); }, [loadArticles]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const suggestTitles = async () => {
    if (!title.trim()) { setNotice({ kind: 'info', text: 'Enter a topic or working title first.' }); return; }
    setWorking('titles');
    setNotice(null);
    setTitleSuggestions([]);
    setLiveDataUsed(null);
    try {
      const res = await fetch('/api/admin/articles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'titles', title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ kind: 'info', text: data.error ?? 'Live keyword data unavailable.' });
        return;
      }
      const suggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];
      if (suggestions.length === 0) {
        setNotice({ kind: 'info', text: 'Live keyword data unavailable.' });
        return;
      }
      setTitleSuggestions(suggestions);
      setLiveDataUsed(!!data.liveData);
    } catch {
      setNotice({ kind: 'info', text: 'Live keyword data unavailable.' });
    } finally {
      setWorking(null);
    }
  };

  const chooseTitle = (value: string) => {
    setTitle(value);
    setSlug(slugify(value));
    setFocusKeyword('');
    setKeywordLocked(false);
    setKeywordSuggestions([]);
    setArticle(null);
    setNotice(null);
  };

  const suggestKeywords = async () => {
    if (!title.trim()) return;
    setWorking('keywords');
    setNotice(null);
    setKeywordSuggestions([]);
    try {
      const res = await fetch('/api/admin/articles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'keywords', title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ kind: 'info', text: data.error ?? 'Live keyword data unavailable.' });
        return;
      }
      const suggestions: string[] = Array.isArray(data.suggestions) ? data.suggestions : [];
      if (suggestions.length === 0) {
        setNotice({ kind: 'info', text: 'Live keyword data unavailable.' });
        return;
      }
      setKeywordSuggestions(suggestions);
    } catch {
      setNotice({ kind: 'info', text: 'Live keyword data unavailable.' });
    } finally {
      setWorking(null);
    }
  };

  const chooseKeyword = (value: string) => {
    setFocusKeyword(value);
    setKeywordLocked(true);
    setNotice(null);
  };

  const improveSlug = async () => {
    if (!title.trim()) return;
    setWorking('slug');
    setNotice(null);
    try {
      const res = await fetch('/api/admin/articles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'slug', title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setNotice({ kind: 'error', text: data.error ?? 'Unable to improve slug.' }); return; }
      if (data.slug) setSlug(data.slug);
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Unable to improve slug.' });
    } finally {
      setWorking(null);
    }
  };

  const generateArticle = async () => {
    if (!canGenerate || duplicateKeyword) return;
    setWorking('generate');
    setNotice(null);
    const stages = [
      'Preparing the article brief…',
      'Writing introduction and key takeaways…',
      'Building sections, examples and comparisons…',
      'Adding FAQ, How-To, internal links and structured data…',
      'Saving article as draft…',
    ];
    let idx = 0;
    setGenerationStage(stages[0]);
    const timer = window.setInterval(() => {
      idx = Math.min(idx + 1, stages.length - 1);
      setGenerationStage(stages[idx]);
    }, 9000);
    try {
      const res = await fetch('/api/admin/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: focusKeyword.trim(),
          primaryKeyword: focusKeyword.trim(),
          secondaryKeywords: [],
          selectedTitle: title.trim(),
          intentAnalysis: 'Informational search intent based on live search suggestions.',
          outline: [],
          metaTitle: title.trim(),
          metaDescription: '',
          urlSlug: slug.trim(),
          lockedKeywords: [focusKeyword.trim()],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Article generation failed.');
      setArticle(data.article);
      await loadArticles();
      setNotice({ kind: 'success', text: 'Article saved as a draft. Review and edit before publishing.' });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Article generation failed.' });
    } finally {
      window.clearInterval(timer);
      setWorking(null);
      setGenerationStage('');
    }
  };

  const saveWorkflow = async (action: WorkflowAction) => {
    if (!article) return;
    if (action === 'publish' && article.status !== 'pending_review') {
      setNotice({ kind: 'info', text: 'Send to review first before publishing.' });
      return;
    }
    setWorking(action);
    setNotice(null);
    const nextStatus: Article['status'] =
      action === 'publish' ? 'published' : action === 'review' ? 'pending_review' : 'draft';
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content: article.content,
          status: nextStatus,
          seoData: {
            ...article.seoData,
            title,
            keywords: [focusKeyword.trim()],
            canonicalUrl: `/blog/${slug}`,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unable to save article.');
      setArticle(data.article);
      await loadArticles();
      const msg =
        action === 'publish' ? 'Article published.' :
        action === 'review'  ? 'Article sent to review.' :
        'Draft saved.';
      setNotice({ kind: 'success', text: msg });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Unable to save article.' });
    } finally {
      setWorking(null);
    }
  };

  const reset = () => {
    setTitle('');
    setTitleSuggestions([]);
    setLiveDataUsed(null);
    setFocusKeyword('');
    setKeywordLocked(false);
    setKeywordSuggestions([]);
    setSlug('');
    setArticle(null);
    setNotice(null);
    setGenerationStage('');
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-500">Content Studio</p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">AI Articles Manager</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Build one focused, SEO-ready article at a time.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
          style={{ borderColor: 'var(--border)' }}
        >
          <X className="h-4 w-4" />
          New article
        </button>
      </div>

      {/* Global notice */}
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      {/* ── Step 1 — Title ── */}
      <StepCard
        number="1"
        title="Article Title"
        description="Enter a topic or title, then use AI to get live search-informed suggestions."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FieldLabel>Article Title</FieldLabel>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!article) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. mortgage calculator for first-time buyers"
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <PrimaryButton
            onClick={() => void suggestTitles()}
            disabled={working !== null}
            loading={working === 'titles'}
          >
            {working !== 'titles' && <span>✨</span>}
            AI Suggest Titles
          </PrimaryButton>
        </div>

        {titleSuggestions.length > 0 && (
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {liveDataUsed ? 'Live search–informed suggestions' : 'AI suggestions'}
              </p>
              <span className="text-xs text-[var(--text-muted)]">Click to use</span>
            </div>
            {!liveDataUsed && (
              <Notice kind="info">Live keyword data unavailable. Showing AI-generated suggestions only.</Notice>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {titleSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => chooseTitle(s)}
                  className="group flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left text-sm text-[var(--text-primary)] transition hover:border-blue-500 hover:bg-blue-500/5"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="leading-snug">{s}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </StepCard>

      {/* ── Step 2 — Focus Keyword ── */}
      <StepCard
        number="2"
        title="Focus Keyword"
        description="Choose the single keyword this article targets. It locks after selection to prevent duplicates."
        locked={!hasTitle}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FieldLabel>Focus Keyword</FieldLabel>
            <div className="relative">
              <input
                value={focusKeyword}
                readOnly={keywordLocked}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder={hasTitle ? 'Select a suggestion or type a keyword' : 'Select a title first'}
                className={`${inputCls} ${keywordLocked ? 'pr-10' : ''}`}
                style={inputStyle}
                disabled={!hasTitle}
              />
              {keywordLocked && (
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
              )}
            </div>
          </div>
          {keywordLocked ? (
            <GhostButton onClick={() => { setKeywordLocked(false); setKeywordSuggestions([]); }}>
              Change keyword
            </GhostButton>
          ) : (
            <PrimaryButton
              onClick={() => void suggestKeywords()}
              disabled={working !== null || !hasTitle}
              loading={working === 'keywords'}
            >
              {working !== 'keywords' && <span>✨</span>}
              AI Suggest Keywords
            </PrimaryButton>
          )}
        </div>

        {duplicateKeyword && (
          <p className="mt-3 flex items-center gap-2 text-xs text-amber-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            This keyword already exists in another saved article. Choose a different one.
          </p>
        )}

        {keywordSuggestions.length > 0 && !keywordLocked && (
          <div className="mt-5 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Related keywords — click to select
            </p>
            <div className="flex flex-wrap gap-2">
              {keywordSuggestions.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => chooseKeyword(kw)}
                  className="flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm text-[var(--text-primary)] transition hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-500"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500/60" />
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}
      </StepCard>

      {/* ── Step 3 — URL Slug ── */}
      <StepCard
        number="3"
        title="URL Slug"
        description="Auto-generated from the title. Edit directly or let AI tighten it."
        locked={!hasTitle}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FieldLabel hint={`/blog/${slug || 'your-slug'}`}>Slug</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-[var(--text-muted)] sm:inline shrink-0">/blog/</span>
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
                }
                placeholder="your-article-slug"
                className={`${inputCls} font-mono`}
                style={inputStyle}
                disabled={!hasTitle}
              />
            </div>
          </div>
          <GhostButton
            onClick={() => void improveSlug()}
            disabled={working !== null || !hasTitle}
            loading={working === 'slug'}
          >
            {working !== 'slug' && <Wand2 className="h-4 w-4" />}
            ✨ AI Improve Slug
          </GhostButton>
        </div>
      </StepCard>

      {/* ── Step 4 — Generate Article ── */}
      <StepCard
        number="4"
        title="Article"
        description="Generate a complete SEO and AI-search-ready article. Edit the content before saving."
        locked={!hasTitle || !hasKeyword || !hasSlug}
      >
        {!article ? (
          <div className="space-y-4">
            <div
              className="rounded-xl border border-dashed p-5 text-sm text-[var(--text-muted)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                <FileText className="h-4 w-4 text-blue-500" />
                What gets generated
              </div>
              <p>
                Introduction · Table of Contents · H2 / H3 sections · FAQ · How-To · Comparison sections ·
                Bullet and numbered lists · Examples · Internal links · Related calculators · CTA ·
                Conclusion · References · Reading time · Meta title · Meta description ·
                OpenGraph · JSON-LD schema
              </p>
            </div>

            {generationStage && <Notice kind="info">{generationStage}</Notice>}

            {duplicateKeyword && (
              <Notice kind="error">
                Duplicate keyword — choose a different focus keyword before generating.
              </Notice>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void generateArticle()}
                disabled={working !== null || !canGenerate || duplicateKeyword}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working === 'generate' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>🚀</span>
                )}
                {working === 'generate' ? 'Generating article…' : 'Generate Article'}
              </button>
              {!canGenerate && !article && (
                <p className="text-xs text-[var(--text-muted)]">
                  Complete title, keyword, and slug to unlock.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(article.status)}`}>
                {statusLabel(article.status)}
              </span>
              {article.wordCount && (
                <span className="text-xs text-[var(--text-muted)]">
                  {article.wordCount.toLocaleString()} words
                </span>
              )}
              {article.readingTime && (
                <span className="text-xs text-[var(--text-muted)]">
                  {article.readingTime} min read
                </span>
              )}
              <span className="ml-auto text-xs text-[var(--text-muted)]">HTML — editable</span>
            </div>

            <textarea
              value={article.content}
              onChange={(e) => setArticle({ ...article, content: e.target.value })}
              rows={24}
              className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
              style={inputStyle}
              aria-label="Article content"
            />

            {/* ── Step 5 — Save ── */}
            <div
              className="flex flex-wrap items-center gap-2 rounded-xl border p-4"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}
            >
              <div className="mr-1 flex-1">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Save workflow</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Draft → Pending Review → Published.{' '}
                  {article.status === 'pending_review'
                    ? 'Ready to publish.'
                    : 'Send to review before publishing.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void saveWorkflow('draft')}
                disabled={working !== null}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                style={{ borderColor: 'var(--border)' }}
              >
                {working === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => void saveWorkflow('review')}
                disabled={working !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
              >
                {working === 'review' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to Review
              </button>
              <button
                type="button"
                onClick={() => void saveWorkflow('publish')}
                disabled={working !== null || article.status !== 'pending_review'}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {working === 'publish' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Publish
              </button>
            </div>
          </div>
        )}
      </StepCard>

      {/* ── Saved Articles ── */}
      <section
        className="rounded-2xl border"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Saved articles</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Open an article to edit its full SEO, schema, FAQ, and How-To fields.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadArticles()}
            title="Refresh"
            className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
          >
            <RefreshCw className={`h-4 w-4 ${loadingArticles ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-2 p-5">
          {loadingArticles ? (
            <div className="flex items-center gap-2 py-6 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading saved articles…
            </div>
          ) : articles.length === 0 ? (
            <div
              className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--text-muted)]"
              style={{ borderColor: 'var(--border)' }}
            >
              No saved articles yet. Generate your first one above.
            </div>
          ) : (
            articles.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 rounded-xl border p-4 transition hover:border-blue-500/40 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{a.title}</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-muted)]">/blog/{a.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(a.status)}`}>
                    {statusLabel(a.status)}
                  </span>
                  <Link
                    href={`/admin/articles/${a.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
