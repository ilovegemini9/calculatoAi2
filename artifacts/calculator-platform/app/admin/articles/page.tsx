'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Lightbulb,
  Loader2,
  Lock,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import type { Article } from '@/lib/types';

type SuggestionKind = 'titles' | 'keywords' | 'slug';
type WorkflowAction = 'draft' | 'review' | 'publish';

const inputClass =
  'w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const inputStyle = {
  borderColor: 'var(--border)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function statusLabel(status: Article['status']) {
  return status === 'pending_review' ? 'Pending Review' : status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: Article['status']) {
  return status === 'published'
    ? 'bg-emerald-500/10 text-emerald-500'
    : status === 'pending_review'
      ? 'bg-amber-500/10 text-amber-500'
      : 'bg-slate-500/10 text-[var(--text-muted)]';
}

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
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
      {hint && <span className="mb-2 block text-xs text-[var(--text-muted)]">{hint}</span>}
      {children}
    </label>
  );
}

function Section({
  step,
  title,
  description,
  locked = false,
  children,
}: {
  step: string;
  title: string;
  description: string;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border ${locked ? 'opacity-60' : ''}`}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
    >
      <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-500">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
        </div>
        {locked && <Lock className="ml-auto mt-1 h-4 w-4 shrink-0 text-[var(--text-muted)]" />}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Notice({
  type,
  children,
}: {
  type: 'success' | 'error' | 'info';
  children: React.ReactNode;
}) {
  const styles = {
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    error: 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400',
    info: 'border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : Lightbulb;
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [title, setTitle] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [focusKeyword, setFocusKeyword] = useState('');
  const [keywordLocked, setKeywordLocked] = useState(false);
  const [slug, setSlug] = useState('');
  const [article, setArticle] = useState<Article | null>(null);
  const [working, setWorking] = useState<SuggestionKind | 'generate' | WorkflowAction | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [generationStage, setGenerationStage] = useState('');

  const loadArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const response = await fetch('/api/admin/blog', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load saved articles.');
      const data = await response.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load saved articles.' });
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  const duplicateKeyword = useMemo(
    () =>
      Boolean(
        focusKeyword.trim() &&
          articles.some((item) =>
            (item.seoData.keywords ?? []).some(
              (keyword) => keyword.toLowerCase() === focusKeyword.trim().toLowerCase(),
            ),
          ),
      ),
    [articles, focusKeyword],
  );

  const requestSuggestions = async (kind: SuggestionKind) => {
    if (!title.trim()) {
      setNotice({ type: 'info', text: 'Enter a topic or working title first.' });
      return;
    }
    setWorking(kind);
    setNotice(null);
    if (kind === 'titles') setTitleSuggestions([]);
    if (kind === 'keywords') setKeywordSuggestions([]);
    try {
      const response = await fetch('/api/admin/articles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, title: title.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Live suggestions unavailable.');
      if (kind === 'titles') setTitleSuggestions(data.suggestions ?? []);
      if (kind === 'keywords') setKeywordSuggestions(data.suggestions ?? []);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Live suggestions unavailable.' });
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
      const response = await fetch('/api/admin/articles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'slug', title: title.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to improve slug.');
      setSlug(data.slug);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to improve slug.' });
    } finally {
      setWorking(null);
    }
  };

  const generateArticle = async () => {
    if (!title.trim() || !focusKeyword.trim() || !slug.trim() || duplicateKeyword) return;
    setWorking('generate');
    setNotice(null);
    setGenerationStage('Preparing the article brief…');
    const stages = [
      'Preparing the article brief…',
      'Writing the introduction and key takeaways…',
      'Building sections, examples, and comparisons…',
      'Adding FAQ, How-To, links, and structured data…',
      'Saving the article as a draft…',
    ];
    let stageIndex = 0;
    const interval = window.setInterval(() => {
      stageIndex = Math.min(stageIndex + 1, stages.length - 1);
      setGenerationStage(stages[stageIndex]);
    }, 9000);
    try {
      const response = await fetch('/api/admin/articles/generate', {
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Article generation failed.');
      setArticle(data.article);
      await loadArticles();
      setNotice({ type: 'success', text: 'Article generated and saved as a draft. Review it before sending or publishing.' });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Article generation failed.' });
    } finally {
      window.clearInterval(interval);
      setWorking(null);
      setGenerationStage('');
    }
  };

  const saveWorkflow = async (action: WorkflowAction) => {
    if (!article) return;
    if (action === 'publish' && article.status !== 'pending_review') {
      setNotice({ type: 'info', text: 'Send the article to review before publishing.' });
      return;
    }
    setWorking(action);
    setNotice(null);
    const nextStatus: Article['status'] =
      action === 'publish' ? 'published' : action === 'review' ? 'pending_review' : 'draft';
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save article.');
      setArticle(data.article);
      await loadArticles();
      setNotice({
        type: 'success',
        text:
          action === 'publish'
            ? 'Article published.'
            : action === 'review'
              ? 'Article sent to review.'
              : 'Draft saved.',
      });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save article.' });
    } finally {
      setWorking(null);
    }
  };

  const resetComposer = () => {
    setTitle('');
    setTitleSuggestions([]);
    setKeywordSuggestions([]);
    setFocusKeyword('');
    setKeywordLocked(false);
    setSlug('');
    setArticle(null);
    setNotice(null);
  };

  const canGenerate = Boolean(title.trim() && focusKeyword.trim() && slug.trim() && !duplicateKeyword);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
            <Sparkles className="h-3.5 w-3.5" />
            Content studio
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">AI Articles Manager</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            Build one useful article at a time with live search-informed suggestions and a deliberate review workflow.
          </p>
        </div>
        <button
          type="button"
          onClick={resetComposer}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
          style={{ borderColor: 'var(--border)' }}
        >
          <X className="h-4 w-4" />
          New article
        </button>
      </div>

      {notice && <Notice type={notice.type}>{notice.text}</Notice>}

      <div className="space-y-4">
        <Section
          step="1"
          title="Article title"
          description="Start with a topic or working title, then use live search suggestions to sharpen it."
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Field label="Article Title" hint="Use a topic seed when you want AI to suggest titles.">
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (!article) setSlug(slugify(event.target.value));
                }}
                placeholder="e.g. mortgage calculator for first-time buyers"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <button
              type="button"
              onClick={() => void requestSuggestions('titles')}
              disabled={working !== null || !title.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {working === 'titles' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Suggest Titles
            </button>
          </div>
          {titleSuggestions.length > 0 && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Live-informed suggestions</p>
                <span className="text-xs text-[var(--text-muted)]">Click one to use it</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {titleSuggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => chooseTitle(suggestion)}
                    className="group flex items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm text-[var(--text-primary)] transition hover:border-blue-500 hover:bg-blue-500/5"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span>{suggestion}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section
          step="2"
          title="Focus keyword"
          description="Choose one focused phrase. It is locked after selection to prevent accidental duplicates."
          locked={!title.trim()}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Field label="Focus Keyword">
              <div className="relative">
                <input
                  value={focusKeyword}
                  readOnly={keywordLocked}
                  onChange={(event) => setFocusKeyword(event.target.value)}
                  placeholder={title.trim() ? 'Select a keyword or enter one' : 'Select a title first'}
                  className={`${inputClass} ${keywordLocked ? 'pr-10' : ''}`}
                  style={inputStyle}
                  disabled={!title.trim()}
                />
                {keywordLocked && <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />}
              </div>
            </Field>
            {keywordLocked ? (
              <button
                type="button"
                onClick={() => setKeywordLocked(false)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
                style={{ borderColor: 'var(--border)' }}
              >
                Change keyword
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void requestSuggestions('keywords')}
                disabled={working !== null || !title.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working === 'keywords' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI Suggest Keywords
              </button>
            )}
          </div>
          {duplicateKeyword && (
            <p className="mt-3 flex items-center gap-2 text-xs text-amber-500">
              <AlertCircle className="h-4 w-4" />
              This keyword is already assigned to a saved article. Choose a different keyword.
            </p>
          )}
          {keywordSuggestions.length > 0 && !keywordLocked && (
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {keywordSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => chooseKeyword(suggestion)}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm text-[var(--text-primary)] transition hover:border-blue-500 hover:bg-blue-500/5"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </Section>

        <Section
          step="3"
          title="URL slug"
          description="Generated from the title. Edit it directly or ask AI for a tighter SEO-friendly version."
          locked={!title.trim()}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Field label="Slug" hint="The article will be available at /blog/{slug || 'your-slug'}">
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-[var(--text-muted)] sm:inline">/blog/</span>
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
                  placeholder="article-slug"
                  className={`${inputClass} font-mono`}
                  style={inputStyle}
                  disabled={!title.trim()}
                />
              </div>
            </Field>
            <button
              type="button"
              onClick={() => void improveSlug()}
              disabled={working !== null || !title.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderColor: 'var(--border)' }}
            >
              {working === 'slug' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              AI Improve Slug
            </button>
          </div>
        </Section>

        <Section
          step="4"
          title="Article"
          description="Generate a complete SEO and AI-search-ready article, then edit the content before saving."
          locked={!canGenerate}
        >
          {!article ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed p-5 text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
                <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Ready when your title, keyword, and slug are set
                </div>
                <p>
                  The generated article includes introduction, table of contents, H2/H3 sections, FAQ, How-To, comparison content, examples, internal links, related calculators, CTA, conclusion, references, reading time, metadata, OpenGraph, and JSON-LD.
                </p>
              </div>
              {generationStage && <Notice type="info">{generationStage}</Notice>}
              <button
                type="button"
                onClick={() => void generateArticle()}
                disabled={working !== null || !canGenerate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {working === 'generate' ? 'Generating article…' : 'Generate Article'}
              </button>
              {!canGenerate && <p className="text-xs text-[var(--text-muted)]">Select a title, focus keyword, and slug to enable generation.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(article.status)}`}>
                    {statusLabel(article.status)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {article.wordCount ? `${article.wordCount.toLocaleString()} words` : 'Editable draft'}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">HTML content</span>
              </div>
              <textarea
                value={article.content}
                onChange={(event) => setArticle({ ...article, content: event.target.value })}
                rows={24}
                className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
                style={inputStyle}
                aria-label="Article content"
              />
              <div className="flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
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
                  {working === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Publish
                </button>
                <span className="ml-auto text-xs text-[var(--text-muted)]">
                  {article.status === 'pending_review' ? 'Ready for explicit publishing.' : 'Publishing unlocks after review.'}
                </span>
              </div>
            </div>
          )}
        </Section>
      </div>

      <section className="rounded-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Saved articles</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Open an article to edit its full SEO, schema, FAQ, and How-To fields.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadArticles()}
            className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
            title="Refresh saved articles"
          >
            <RefreshCw className={`h-4 w-4 ${loadingArticles ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="space-y-2 p-5">
          {loadingArticles ? (
            <div className="flex items-center gap-2 py-6 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading saved articles…
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              No saved articles yet.
            </div>
          ) : (
            articles.map((savedArticle) => (
              <div
                key={savedArticle.id}
                className="flex flex-col gap-3 rounded-xl border p-4 transition hover:border-blue-500/50 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{savedArticle.title}</p>
                  <p className="mt-1 truncate font-mono text-xs text-[var(--text-muted)]">/blog/{savedArticle.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(savedArticle.status)}`}>
                    {statusLabel(savedArticle.status)}
                  </span>
                  <Link
                    href={`/admin/articles/${savedArticle.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
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