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
  ShieldCheck,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import type {
  Article,
  SuggestedCalculator,
  RelatedArticle,
  InternalLinkSuggestion,
  ArticleEntity,
  EeatSignals,
  SeoAudit,
  SeoCheck,
  ArticleValidationReport,
  ValidationCheck,
} from '@/lib/types';

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
  // Related Content Engine state (Phase 8)
  const [suggestedCalculator, setSuggestedCalculator] = useState<SuggestedCalculator | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [internalLinkSuggestions, setInternalLinkSuggestions] = useState<InternalLinkSuggestion[]>([]);
  // Related Content Engine generation state
  const [relatedGenerating, setRelatedGenerating] = useState(false);
  const [relatedGenError, setRelatedGenError] = useState('');
  const [relatedGenSuccess, setRelatedGenSuccess] = useState(false);
  // AI SEO Optimizer state (Phase 9)
  const [aiSeoOptimizing, setAiSeoOptimizing] = useState(false);
  const [aiSeoOptimizeError, setAiSeoOptimizeError] = useState('');
  const [aiSeoOptimizeSuccess, setAiSeoOptimizeSuccess] = useState(false);
  const [seoAudit, setSeoAudit] = useState<SeoAudit | null>(null);
  const [aiOverviewTarget, setAiOverviewTarget] = useState('');
  const [semanticKeywords, setSemanticKeywords] = useState<string[]>([]);
  const [entities, setEntities] = useState<ArticleEntity[]>([]);
  const [eeatSignals, setEeatSignals] = useState<EeatSignals | null>(null);
  // Phase 10: Quality Validation state
  const [validating, setValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<ArticleValidationReport | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [saveBlocked, setSaveBlocked] = useState(false);

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
      // Related Content Engine
      setSuggestedCalculator(data.suggestedCalculator ?? null);
      setRelatedArticles(data.relatedArticles || []);
      setInternalLinkSuggestions(data.internalLinkSuggestions || []);
      // AI SEO Optimizer (Phase 9)
      setSeoAudit(data.seoAudit ?? null);
      setAiOverviewTarget(data.aiOverviewTarget || '');
      setSemanticKeywords(data.semanticKeywords || []);
      setEntities(data.entities || []);
      setEeatSignals(data.eeatSignals ?? null);
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

  // ─── Validate ──────────────────────────────────────────────────────────────

  const handleValidate = async (): Promise<ArticleValidationReport | null> => {
    setValidating(true);
    setShowValidation(true);
    try {
      const res = await fetch(`/api/admin/articles/${id}/validate`, { method: 'POST' });
      const data = await res.json() as { success?: boolean; report?: ArticleValidationReport; error?: string };
      if (!res.ok || !data.success || !data.report) throw new Error(data.error || 'Validation failed');
      setValidationReport(data.report);
      return data.report;
    } catch {
      setValidationReport(null);
      return null;
    } finally {
      setValidating(false);
    }
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async (skipValidation = false) => {
    // Run validation before saving unless admin explicitly skips
    if (!skipValidation) {
      setSaving(true);
      setSaveError('');
      setSaved(false);
      const report = await handleValidate();
      setSaving(false);
      if (report && report.hasErrors) {
        setSaveBlocked(true);
        return; // Block save — show report, wait for admin action
      }
      setSaveBlocked(false);
    }
    setSaving(true);
    setSaveError('');
    setSaved(false);
    setSaveBlocked(false);
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
        // Related Content Engine
        suggestedCalculator,
        relatedArticles,
        internalLinkSuggestions,
        // AI SEO Optimizer (Phase 9)
        ...(seoAudit ? { seoAudit } : {}),
        ...(aiOverviewTarget.trim() ? { aiOverviewTarget: aiOverviewTarget.trim() } : {}),
        ...(semanticKeywords.length > 0 ? { semanticKeywords } : {}),
        ...(entities.length > 0 ? { entities } : {}),
        ...(eeatSignals ? { eeatSignals } : {}),
        aiSeoOptimized: article?.aiSeoOptimized,
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

  // ─── Related Content Generate ──────────────────────────────────────────────

  const handleGenerateRelated = useCallback(async () => {
    setRelatedGenerating(true);
    setRelatedGenError('');
    setRelatedGenSuccess(false);
    try {
      const res = await fetch(`/api/admin/articles/${id}/suggest-related`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json() as {
        success?: boolean;
        aiUsed?: boolean;
        suggestedCalculator?: SuggestedCalculator | null;
        relatedArticles?: RelatedArticle[];
        internalLinkSuggestions?: InternalLinkSuggestion[];
        error?: string;
      };
      if (!res.ok || !data.success) throw new Error(data.error || 'Generation failed');
      if (data.suggestedCalculator !== undefined) setSuggestedCalculator(data.suggestedCalculator ?? null);
      if (data.relatedArticles !== undefined) setRelatedArticles(data.relatedArticles);
      if (data.internalLinkSuggestions !== undefined) setInternalLinkSuggestions(data.internalLinkSuggestions);
      setRelatedGenSuccess(true);
      setTimeout(() => setRelatedGenSuccess(false), 4000);
    } catch (e: unknown) {
      setRelatedGenError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setRelatedGenerating(false);
    }
  }, [id]);

  // ─── AI SEO Optimize ───────────────────────────────────────────────────────

  const handleAiSeoOptimize = useCallback(async () => {
    setAiSeoOptimizing(true);
    setAiSeoOptimizeError('');
    setAiSeoOptimizeSuccess(false);
    try {
      const res = await fetch(`/api/admin/articles/${id}/ai-seo-optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json() as {
        success?: boolean;
        aiUsed?: boolean;
        seoAudit?: SeoAudit;
        aiOverviewTarget?: string;
        semanticKeywords?: string[];
        entities?: ArticleEntity[];
        eeatSignals?: EeatSignals;
        schemaArticle?: string;
        error?: string;
      };
      if (!res.ok || !data.success) throw new Error(data.error || 'Optimization failed');
      if (data.seoAudit) setSeoAudit(data.seoAudit);
      if (data.aiOverviewTarget) setAiOverviewTarget(data.aiOverviewTarget);
      if (data.semanticKeywords?.length) setSemanticKeywords(data.semanticKeywords);
      if (data.entities?.length) setEntities(data.entities);
      if (data.eeatSignals) setEeatSignals(data.eeatSignals);
      if (data.schemaArticle) setSchemaArticle(data.schemaArticle);
      setAiSeoOptimizeSuccess(true);
      setTimeout(() => setAiSeoOptimizeSuccess(false), 5000);
    } catch (e: unknown) {
      setAiSeoOptimizeError(e instanceof Error ? e.message : 'Optimization failed');
    } finally {
      setAiSeoOptimizing(false);
    }
  }, [id]);

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
            onClick={() => handleValidate()}
            disabled={validating || saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-blue-500/40 disabled:opacity-50 transition"
            style={{ borderColor: 'var(--border)' }}
            title="Run quality validation"
          >
            {validating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {validating ? 'Checking…' : 'Validate'}
          </button>

          <button
            onClick={() => handleSave()}
            disabled={saving || validating}
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

      {/* ── Phase 10: Validation Report Panel ────────────────────────────────── */}
      {showValidation && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: validationReport?.hasErrors ? 'rgba(239,68,68,0.35)' : validationReport?.hasWarnings ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.35)', backgroundColor: 'var(--bg-card)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              {validating ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              ) : validationReport?.hasErrors ? (
                <ShieldAlert className="w-4 h-4 text-red-400" />
              ) : validationReport?.hasWarnings ? (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {validating ? 'Running quality checks…' : 'Quality Validation Report'}
              </span>
              {!validating && validationReport && (
                <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                  validationReport.score >= 80 ? 'bg-emerald-500/15 text-emerald-400' :
                  validationReport.score >= 50 ? 'bg-amber-500/15 text-amber-400' :
                  'bg-red-500/15 text-red-400'
                }`}>
                  Score: {validationReport.score}/100
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!validating && saveBlocked && validationReport?.hasErrors && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 disabled:opacity-50 transition"
                >
                  <Save className="w-3 h-3" /> Save Anyway
                </button>
              )}
              <button
                onClick={() => setShowValidation(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Check list */}
          {!validating && validationReport && (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {validationReport.checks.map((check: ValidationCheck) => (
                <div key={check.id} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0">
                      {check.status === 'pass' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : check.status === 'warn' ? (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{check.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                          check.status === 'pass' ? 'bg-emerald-500/15 text-emerald-400' :
                          check.status === 'warn' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {check.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{check.detail}</p>
                      {check.recommendations && check.recommendations.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {check.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-xs text-[var(--text-primary)] flex items-start gap-1.5">
                              <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save blocked message */}
          {!validating && saveBlocked && validationReport?.hasErrors && (
            <div className="px-5 py-3 border-t bg-red-500/5" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <p className="text-xs text-red-400">
                <strong>Save blocked:</strong> Fix the issues above before saving, or click <strong>Save Anyway</strong> to override and save with known problems.
              </p>
            </div>
          )}

          {/* Validated-at timestamp */}
          {!validating && validationReport && (
            <div className="px-5 py-2 border-t text-[10px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              Validated {new Date(validationReport.validatedAt).toLocaleTimeString()} · {validationReport.checks.filter((c: ValidationCheck) => c.status === 'pass').length} passed · {validationReport.checks.filter((c: ValidationCheck) => c.status === 'warn').length} warnings · {validationReport.checks.filter((c: ValidationCheck) => c.status === 'fail').length} failed
            </div>
          )}
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

              {/* ── AI SEO OPTIMIZER ── */}
              <div
                className="rounded-xl border p-5 space-y-4"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">AI SEO Optimizer</h2>
                  <span className="text-xs text-[var(--text-muted)] ml-1">— Google · AI Overviews · Voice · E-E-A-T · Rich Results</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Audits the article against 15 SEO signals and enriches it with an AI Overview target, semantic keywords, entity detection, and E-E-A-T analysis. Works with or without an AI key.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleAiSeoOptimize}
                    disabled={aiSeoOptimizing}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition whitespace-nowrap"
                  >
                    {aiSeoOptimizing
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Optimizing…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Run AI SEO Optimizer</>}
                  </button>
                  {seoAudit && (
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                        seoAudit.score >= 80 ? 'border-emerald-500 text-emerald-400' :
                        seoAudit.score >= 60 ? 'border-amber-500 text-amber-400' :
                        'border-red-500 text-red-400'
                      }`}>
                        {seoAudit.score}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">SEO Score</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {seoAudit.checks.filter(c => c.status === 'pass').length} pass · {seoAudit.checks.filter(c => c.status === 'warn').length} warn · {seoAudit.checks.filter(c => c.status === 'fail').length} fail
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {aiSeoOptimizeError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {aiSeoOptimizeError}
                  </div>
                )}
                {aiSeoOptimizeSuccess && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> Optimization complete. Review the results below, then Save Changes.
                  </div>
                )}

                {/* SEO Audit Checklist */}
                {seoAudit && (
                  <div className="rounded-xl border divide-y" style={{ borderColor: 'var(--border)' }}>
                    {seoAudit.checks.map((c: SeoCheck, i: number) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <span className={`mt-0.5 shrink-0 text-lg leading-none ${
                          c.status === 'pass' ? 'text-emerald-400' :
                          c.status === 'warn' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {c.status === 'pass' ? '✓' : c.status === 'warn' ? '⚠' : '✗'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{c.label}</p>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{c.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Overview Target */}
              {(aiOverviewTarget || aiSeoOptimizeSuccess) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    AI Overview Target
                    <span className="text-xs font-normal text-[var(--text-muted)]">— 40–60 word answer for Google AI Overviews, ChatGPT, Gemini, Perplexity</span>
                  </label>
                  <p className="text-xs text-[var(--text-muted)]">
                    Displayed as a &quot;Quick Answer&quot; callout on the public article page. Editable.
                  </p>
                  <textarea
                    value={aiOverviewTarget}
                    onChange={(e) => setAiOverviewTarget(e.target.value)}
                    rows={3}
                    placeholder="A 40–60 word direct answer to the main query…"
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <p className={`text-xs font-mono ${aiOverviewTarget.split(/\s+/).filter(Boolean).length > 60 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
                    {aiOverviewTarget.split(/\s+/).filter(Boolean).length} words (target: 40–60)
                  </p>
                </div>
              )}

              {/* Semantic Keywords */}
              {semanticKeywords.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    Semantic Keywords
                    <span className="text-xs font-normal text-[var(--text-muted)]">— LSI / topic-cluster vocabulary</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {semanticKeywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-purple-600/10 text-purple-400 border border-purple-600/20">
                        {kw}
                        <button
                          onClick={() => setSemanticKeywords(prev => prev.filter((_, j) => j !== i))}
                          className="hover:text-red-400 transition ml-0.5"
                        >×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* E-E-A-T Signals */}
              {eeatSignals && (
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">E-E-A-T Signals</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)] mb-1">Expertise — <span className="font-normal capitalize text-blue-400">{eeatSignals.expertiseLevel}</span></p>
                      <ul className="space-y-0.5 text-[var(--text-muted)]">
                        {eeatSignals.authoritySignals.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)] mb-1">Trust &amp; Experience</p>
                      <ul className="space-y-0.5 text-[var(--text-muted)]">
                        {[...eeatSignals.trustSignals, ...eeatSignals.experienceIndicators].map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Entities */}
              {entities.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    Named Entities
                    <span className="text-xs font-normal text-[var(--text-muted)]">— Entity SEO signals</span>
                  </label>
                  <div className="rounded-xl border divide-y" style={{ borderColor: 'var(--border)' }}>
                    {entities.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 shrink-0 font-medium capitalize">{e.type}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{e.name}</p>
                          {e.description && <p className="text-xs text-[var(--text-muted)] leading-relaxed">{e.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            <div className="space-y-6">

              {/* ── Generate panel ────────────────────────────────────────── */}
              <div
                className="rounded-xl border p-5 space-y-4"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Auto-Generate Related Content</h2>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Analyzes this article against all existing calculators and published articles. Suggests the best matching calculator, up to 3 related articles, and up to 5 internal link suggestions. All results are editable before saving.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleGenerateRelated}
                    disabled={relatedGenerating}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
                  >
                    {relatedGenerating
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
                      : <><Sparkles className="w-3.5 h-3.5" /> Generate Related Content</>}
                  </button>
                  <span className="text-xs text-[var(--text-muted)]">Uses AI when available, falls back to keyword matching.</span>
                </div>
                {relatedGenError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {relatedGenError}
                  </div>
                )}
                {relatedGenSuccess && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> Related content generated. Review and edit below, then Save Changes.
                  </div>
                )}
              </div>

              {/* ── Suggested Calculator ──────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> Suggested Calculator
                  </p>
                  <span className="text-xs text-[var(--text-muted)]">Auto-detected · editable</span>
                </div>

                {suggestedCalculator ? (
                  <div
                    className="rounded-xl border p-4 space-y-3"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-blue-400">{suggestedCalculator.name}</p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">/{suggestedCalculator.slug}</p>
                        {suggestedCalculator.description && (
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{suggestedCalculator.description}</p>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 capitalize">
                          {suggestedCalculator.category}
                        </span>
                      </div>
                      <button
                        onClick={() => setSuggestedCalculator(null)}
                        className="text-xs text-red-400 hover:text-red-300 transition shrink-0 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Override fields */}
                    <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs text-[var(--text-muted)]">Override name or description:</p>
                      <input
                        value={suggestedCalculator.name}
                        onChange={(e) => setSuggestedCalculator({ ...suggestedCalculator, name: e.target.value })}
                        placeholder="Calculator name"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      <textarea
                        value={suggestedCalculator.description}
                        onChange={(e) => setSuggestedCalculator({ ...suggestedCalculator, description: e.target.value })}
                        rows={2}
                        placeholder="Short description shown in the card"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      <input
                        value={suggestedCalculator.slug}
                        onChange={(e) => setSuggestedCalculator({ ...suggestedCalculator, slug: e.target.value })}
                        placeholder="calculator-slug"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        style={{ borderColor: 'var(--border)' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-xl border border-dashed p-5 text-center space-y-2"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <p className="text-xs text-[var(--text-muted)]">No calculator matched. Add one manually:</p>
                    <button
                      onClick={() => setSuggestedCalculator({
                        calculatorId: '', slug: '', name: '', description: '', category: '',
                      })}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      + Add Calculator
                    </button>
                  </div>
                )}
              </div>

              {/* ── Related Articles ──────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Related Articles
                  </p>
                  <button
                    onClick={() => setRelatedArticles((prev) => [
                      ...prev,
                      { articleId: '', slug: '', title: '', description: '' },
                    ])}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    + Add
                  </button>
                </div>

                {relatedArticles.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic">No related articles detected. Click Add to add one manually.</p>
                ) : (
                  <div className="space-y-3">
                    {relatedArticles.map((ra, i) => (
                      <div
                        key={i}
                        className="rounded-xl border p-4 space-y-2"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--text-muted)]">Article #{i + 1}</span>
                          <button
                            onClick={() => setRelatedArticles((prev) => prev.filter((_, j) => j !== i))}
                            className="text-xs text-red-400 hover:text-red-300 transition"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          value={ra.title}
                          onChange={(e) => setRelatedArticles((prev) =>
                            prev.map((x, j) => j === i ? { ...x, title: e.target.value } : x)
                          )}
                          placeholder="Article title"
                          className="w-full px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ borderColor: 'var(--border)' }}
                        />
                        <input
                          value={ra.slug}
                          onChange={(e) => setRelatedArticles((prev) =>
                            prev.map((x, j) => j === i ? { ...x, slug: e.target.value } : x)
                          )}
                          placeholder="url-slug (without /blog/)"
                          className="w-full px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                          style={{ borderColor: 'var(--border)' }}
                        />
                        <textarea
                          value={ra.description}
                          onChange={(e) => setRelatedArticles((prev) =>
                            prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x)
                          )}
                          rows={2}
                          placeholder="Short description (optional)"
                          className="w-full px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Internal Link Suggestions ─────────────────────────────── */}
              {internalLinkSuggestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> Internal Link Suggestions
                    <span className="font-normal normal-case text-[var(--text-muted)]">— copy anchor text + URL into your content</span>
                  </p>
                  <div className="rounded-xl border divide-y" style={{ borderColor: 'var(--border)' }}>
                    {internalLinkSuggestions.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          s.targetType === 'calculator'
                            ? 'bg-blue-500/15 text-blue-400'
                            : 'bg-purple-500/15 text-purple-400'
                        }`}>
                          {s.targetType}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)] truncate">{s.anchorText}</p>
                          <p className="text-xs text-[var(--text-muted)] font-mono truncate">{s.targetSlug}</p>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(
                            `<a href="${s.targetSlug}">${s.anchorText}</a>`
                          )}
                          className="text-xs text-[var(--text-muted)] hover:text-blue-400 transition shrink-0 px-2 py-1 rounded border hover:border-blue-500/40"
                          style={{ borderColor: 'var(--border)' }}
                          title="Copy HTML link"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Legacy: Related Calculator Slugs ─────────────────────── */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">All Related Calculator Slugs</p>
                <p className="text-xs text-[var(--text-muted)]">Raw slug list — one per line. The &quot;Suggested Calculator&quot; above populates this automatically.</p>
                <Textarea
                  value={relatedCalculators.join('\n')}
                  onChange={(v) => setRelatedCalculators(v.split('\n').map((k) => k.trim()).filter(Boolean))}
                  rows={4}
                  placeholder="mortgage&#10;bmi&#10;loan"
                  mono
                />
                {relatedCalculators.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
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
              </div>

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
            onClick={() => handleSave()}
            disabled={saving || validating}
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
