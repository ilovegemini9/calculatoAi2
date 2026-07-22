'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Tag,
  Clock,
  BookOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  BarChart2,
  Zap,
} from 'lucide-react';
import type { Article } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Opportunity {
  keyword: string;
  type: string;
  searchIntent: string;
  opportunityScore: number;
  searchVolume: string;
  competition: string;
  difficulty: number;
  trend: string;
  estimatedCtr: string;
  titles: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  intentAnalysis: string;
  outline: { heading: string; level: string; subpoints: string[] }[];
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
}

type View = 'list' | 'research' | 'configure' | 'generating' | 'done';
type StatusFilter = 'all' | 'draft' | 'pending_review' | 'published';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-500';
  if (score >= 40) return 'text-amber-500';
  return 'text-red-500';
}

function scoreBar(score: number) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold w-7 text-right ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'declining') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
}

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

function CompBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    low: 'text-emerald-400',
    medium: 'text-amber-400',
    high: 'text-red-400',
  };
  return <span className={`text-xs font-semibold capitalize ${map[level] ?? ''}`}>{level}</span>;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArticlesPage() {
  // ── List state
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteId, setDeleteId] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Workflow state
  const [view, setView] = useState<View>('list');

  // ── Research state
  const [researchQuery, setResearchQuery] = useState('');
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // ── Configure state
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');

  // ── Generate state
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState<Article | null>(null);
  const [genStage, setGenStage] = useState('');

  // ─── Load articles list ─────────────────────────────────────────────────────

  const loadArticles = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const res = await fetch('/api/admin/blog');
      if (!res.ok) throw new Error('Failed to load articles');
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  // ─── Keyword research ───────────────────────────────────────────────────────

  const handleResearch = async () => {
    if (!researchQuery.trim()) return;
    setResearching(true);
    setResearchError('');
    setOpportunities([]);
    try {
      const res = await fetch('/api/admin/articles/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: researchQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research failed');
      setOpportunities(data.opportunities || []);
    } catch (e: unknown) {
      setResearchError(e instanceof Error ? e.message : 'Research failed');
    } finally {
      setResearching(false);
    }
  };

  // ─── Select opportunity → configure ────────────────────────────────────────

  const selectOpportunity = (opp: Opportunity) => {
    setSelectedOpp(opp);
    const defaultTitle = opp.titles[0] || opp.keyword;
    setSelectedTitle(defaultTitle);
    setSlug(opp.urlSlug || slugify(defaultTitle));
    setRelatedKeywords([...opp.secondaryKeywords]);
    setDuplicateWarning('');
    // Check duplicates against existing
    const existingKws = articles.flatMap((a) => a.seoData.keywords);
    if (existingKws.some((k) => k.toLowerCase() === opp.keyword.toLowerCase())) {
      setDuplicateWarning(`⚠️ Keyword "${opp.keyword}" already exists in another article.`);
    }
    setView('configure');
  };

  // ─── Generate article ───────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selectedOpp || !selectedTitle.trim()) return;
    setGenerating(true);
    setGenError('');
    setView('generating');
    setGenStage('Sending request to AI...');

    const stages = [
      'Analyzing keyword opportunities...',
      'Building article outline...',
      'Writing article content...',
      'Generating FAQ & How-To sections...',
      'Building comparison tables...',
      'Injecting internal links & calculator references...',
      'Generating schemas (Article, FAQ, HowTo)...',
      'Building Table of Contents...',
      'Calculating reading time...',
      'Finalizing and saving...',
    ];
    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, stages.length - 1);
      setGenStage(stages[stageIdx]);
    }, 8000);

    try {
      const res = await fetch('/api/admin/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: selectedOpp.keyword,
          primaryKeyword: selectedOpp.primaryKeyword,
          secondaryKeywords: relatedKeywords,
          selectedTitle: selectedTitle.trim(),
          intentAnalysis: selectedOpp.intentAnalysis,
          outline: selectedOpp.outline,
          metaTitle: selectedOpp.metaTitle,
          metaDescription: selectedOpp.metaDescription,
          urlSlug: slug,
          lockedKeywords: [],
          opportunityScore: selectedOpp.opportunityScore,
          searchVolume: selectedOpp.searchVolume,
          competition: selectedOpp.competition,
          difficulty: selectedOpp.difficulty,
          trend: selectedOpp.trend,
          estimatedCtr: selectedOpp.estimatedCtr,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGeneratedArticle(data.article);
      await loadArticles();
      setView('done');
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : 'Generation failed');
      setView('configure');
    } finally {
      clearInterval(stageInterval);
      setGenerating(false);
    }
  };

  // ─── Delete article ──────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Delete failed');
      }
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeleting(false);
      setDeleteId('');
    }
  };

  // ─── Computed ────────────────────────────────────────────────────────────────

  const filtered = articles.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.seoData.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: articles.length,
    draft: articles.filter((a) => a.status === 'draft').length,
    pending: articles.filter((a) => a.status === 'pending_review').length,
    published: articles.filter((a) => a.status === 'published').length,
  };

  // ─── Reset ───────────────────────────────────────────────────────────────────

  const resetWorkflow = () => {
    setView('list');
    setSelectedOpp(null);
    setOpportunities([]);
    setResearchQuery('');
    setResearchError('');
    setGenError('');
    setGeneratedArticle(null);
    setGenStage('');
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">AI Articles Manager</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Research keywords, generate SEO-optimised articles, and manage content.
          </p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => { setView('research'); setResearchError(''); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Article
          </button>
        )}
        {view !== 'list' && (
          <button
            onClick={resetWorkflow}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
          >
            <X className="w-3.5 h-3.5" />
            Back to List
          </button>
        )}
      </div>

      {/* ── Stats row ── */}
      {view === 'list' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Articles', value: stats.total, icon: <BookOpen className="w-4 h-4" /> },
            { label: 'Draft', value: stats.draft, icon: <FileText className="w-4 h-4" /> },
            { label: 'Pending Review', value: stats.pending, icon: <AlertCircle className="w-4 h-4" /> },
            { label: 'Published', value: stats.published, icon: <CheckCircle className="w-4 h-4" /> },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border p-4 flex flex-col gap-2"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {s.label}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)]"
                  style={{ backgroundColor: 'var(--bg-card-hover)' }}
                >
                  {s.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: LIST
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'list' && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          {/* Toolbar */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3 border-b"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
          >
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(['all', 'draft', 'pending_review', 'published'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'pending_review' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={loadArticles}
              className="ml-auto p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table */}
          {loadingList ? (
            <div className="flex items-center justify-center py-16 text-[var(--text-muted)] text-sm">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading articles…
            </div>
          ) : listError ? (
            <div className="flex items-center justify-center py-16 text-red-400 text-sm gap-2">
              <AlertCircle className="w-4 h-4" /> {listError}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <FileText className="w-10 h-10 text-[var(--text-muted)] opacity-40" />
              <p className="text-sm text-[var(--text-muted)]">
                {articles.length === 0 ? 'No articles yet. Generate your first article above.' : 'No articles match your filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
                    {['Title', 'Status', 'Keywords', 'Reading Time', 'Words', 'Created', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((article) => (
                    <tr
                      key={article.id}
                      className="hover:bg-[var(--bg-card-hover)] transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-medium text-[var(--text-primary)] truncate">{article.title}</div>
                        <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-0.5">
                          /blog/{article.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={article.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(article.seoData.keywords || []).slice(0, 3).map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-600/10 text-blue-400"
                            >
                              <Tag className="w-2.5 h-2.5" /> {k}
                            </span>
                          ))}
                          {(article.seoData.keywords || []).length > 3 && (
                            <span className="text-xs text-[var(--text-muted)]">
                              +{(article.seoData.keywords || []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-[var(--text-muted)]">
                        {article.readingTime ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {article.readingTime} min
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-[var(--text-muted)]">
                        {article.wordCount ? article.wordCount.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--text-muted)]">
                        {formatDate(article.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <a
                            href={`/admin/articles/${article.id}`}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-600/10 transition"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`/blog/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-400 hover:bg-emerald-600/10 transition"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setDeleteId(article.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-600/10 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: KEYWORD RESEARCH
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'research' && (
        <div className="space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="text-blue-400 font-medium">1. Keyword Research</span>
            <ChevronRight className="w-3 h-3" />
            <span>2. Configure</span>
            <ChevronRight className="w-3 h-3" />
            <span>3. Generate</span>
          </div>

          {/* Search box */}
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
          >
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Search Keyword Opportunities</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Enter a topic or niche. Live keyword data will be retrieved and scored by AI.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                  placeholder="e.g. mortgage calculator, BMI, loan interest…"
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <button
                onClick={handleResearch}
                disabled={researching || !researchQuery.trim()}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {researching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {researching ? 'Searching…' : 'Find Opportunities'}
              </button>
            </div>
            {researchError && (
              <p className="mt-3 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {researchError}
              </p>
            )}
          </div>

          {/* Results table */}
          {opportunities.length > 0 && (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
            >
              <div
                className="px-5 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {opportunities.length} Keyword Opportunities
                </p>
                <span className="text-xs text-[var(--text-muted)]">Click a row to continue</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
                      {[
                        'Keyword',
                        'Search Volume',
                        'Competition',
                        'SEO Difficulty',
                        'Opportunity Score',
                        'Trend',
                        'Est. CTR',
                        '',
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opp, i) => (
                      <tr
                        key={i}
                        className="hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onClick={() => selectOpportunity(opp)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-[var(--text-primary)]">{opp.keyword}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                            <BarChart2 className="w-3 h-3" /> {opp.searchIntent}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[var(--text-primary)] font-mono text-xs">
                          {opp.searchVolume}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <CompBadge level={opp.competition} />
                        </td>
                        <td className="px-4 py-3.5 min-w-[130px]">{scoreBar(opp.difficulty)}</td>
                        <td className="px-4 py-3.5 min-w-[130px]">{scoreBar(opp.opportunityScore)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <TrendIcon trend={opp.trend} />
                            <span className="text-xs capitalize text-[var(--text-muted)]">{opp.trend}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-semibold text-emerald-400">
                          {opp.estimatedCtr}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); selectOpportunity(opp); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition whitespace-nowrap"
                          >
                            Select →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: CONFIGURE
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'configure' && selectedOpp && (
        <div className="space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <button onClick={() => setView('research')} className="hover:text-blue-400 transition">
              1. Keyword Research
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-400 font-medium">2. Configure</span>
            <ChevronRight className="w-3 h-3" />
            <span>3. Generate</span>
          </div>

          {/* Opportunity summary card */}
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedOpp.keyword}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedOpp.intentAnalysis}</p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-center">
                  <div className={`text-lg font-bold ${scoreColor(selectedOpp.opportunityScore)}`}>
                    {selectedOpp.opportunityScore}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Opportunity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)]">{selectedOpp.searchVolume}</div>
                  <div className="text-xs text-[var(--text-muted)]">Monthly Searches</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${scoreColor(100 - selectedOpp.difficulty)}`}>
                    {selectedOpp.difficulty}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">SEO Difficulty</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">{selectedOpp.estimatedCtr}</div>
                  <div className="text-xs text-[var(--text-muted)]">Est. CTR</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <TrendIcon trend={selectedOpp.trend} />
                    <span className="text-sm font-bold capitalize text-[var(--text-primary)]">{selectedOpp.trend}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">Trend</div>
                </div>
              </div>
            </div>
          </div>

          {duplicateWarning && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
              {duplicateWarning}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Title selection */}
            <div
              className="rounded-xl border p-5 space-y-3"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
            >
              <p className="text-sm font-semibold text-[var(--text-primary)]">Select or Write a Title</p>
              <div className="space-y-2">
                {selectedOpp.titles.map((t) => (
                  <label key={t} className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="title"
                      value={t}
                      checked={selectedTitle === t}
                      onChange={() => {
                        setSelectedTitle(t);
                        setSlug(slugify(t));
                      }}
                      className="mt-0.5 accent-blue-600"
                    />
                    <span
                      className={`text-sm ${
                        selectedTitle === t
                          ? 'text-[var(--text-primary)] font-medium'
                          : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t}
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
                  Or write a custom title:
                </label>
                <input
                  value={selectedTitle}
                  onChange={(e) => {
                    setSelectedTitle(e.target.value);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="Custom title…"
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            {/* Slug & Keywords */}
            <div className="space-y-5">
              <div
                className="rounded-xl border p-5 space-y-3"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">URL Slug</p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                  <span className="font-mono">/blog/</span>
                </div>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>

              <div
                className="rounded-xl border p-5 space-y-3"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">Related Keywords</p>
                <p className="text-xs text-[var(--text-muted)]">These will be integrated naturally into the article.</p>
                <div className="flex flex-wrap gap-1.5">
                  {relatedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-600/10 text-blue-400 border border-blue-600/20"
                    >
                      {kw}
                      <button
                        onClick={() => setRelatedKeywords((prev) => prev.filter((k) => k !== kw))}
                        className="hover:text-red-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newKeyword.trim()) {
                        const kw = newKeyword.trim().toLowerCase();
                        if (!relatedKeywords.includes(kw)) setRelatedKeywords((prev) => [...prev, kw]);
                        setNewKeyword('');
                      }
                    }}
                    placeholder="Add keyword, press Enter…"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: 'var(--border)' }}
                  />
                  <button
                    onClick={() => {
                      const kw = newKeyword.trim().toLowerCase();
                      if (kw && !relatedKeywords.includes(kw)) setRelatedKeywords((prev) => [...prev, kw]);
                      setNewKeyword('');
                    }}
                    disabled={!newKeyword.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Article outline preview */}
          {selectedOpp.outline.length > 0 && (
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
            >
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Article Outline</p>
              <div className="space-y-2">
                {selectedOpp.outline.map((item, i) => (
                  <div key={i} className={item.level === 'h3' ? 'ml-5' : ''}>
                    <p className={`text-sm font-medium ${item.level === 'h2' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {item.level === 'h2' ? '## ' : '### '}{item.heading}
                    </p>
                    {item.subpoints?.map((sp, j) => (
                      <p key={j} className="text-xs text-[var(--text-muted)] ml-4 mt-0.5">· {sp}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {genError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {genError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('research')}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border transition"
              style={{ borderColor: 'var(--border)' }}
            >
              ← Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedTitle.trim() || !slug.trim()}
              className="px-6 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Generate Article
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: GENERATING
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'generating' && (
        <div
          className="rounded-xl border p-10 flex flex-col items-center gap-6"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center">
            <Zap className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-[var(--text-primary)]">Generating Article</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">This takes about 60–120 seconds. Please wait…</p>
          </div>
          <div className="w-full max-w-md space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{genStage}</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-[8000ms]"
                style={{ width: generating ? '85%' : '100%' }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-md text-center text-xs text-[var(--text-muted)]">
            {['Content', 'FAQ + HowTo', 'Schemas', 'TOC', 'Links', 'Reading Time'].map((s) => (
              <div key={s} className="flex items-center gap-1 justify-center">
                <CheckCircle className="w-3 h-3 text-blue-400" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: DONE
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'done' && generatedArticle && (
        <div className="space-y-5">
          <div
            className="rounded-xl border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[var(--text-primary)]">Article Generated Successfully</p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Saved as <StatusBadge status={generatedArticle.status} />. Open the editor to review and edit all sections before publishing.
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-[var(--text-muted)]">
                {generatedArticle.wordCount && (
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {generatedArticle.wordCount.toLocaleString()} words</span>
                )}
                {generatedArticle.readingTime && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {generatedArticle.readingTime} min read</span>
                )}
                {generatedArticle.faqItems && (
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> {generatedArticle.faqItems.length} FAQ pairs</span>
                )}
                {generatedArticle.howToSteps && generatedArticle.howToSteps.length > 0 && (
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> How-To section</span>
                )}
                {generatedArticle.tableOfContents && (
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> Table of Contents</span>
                )}
                {generatedArticle.schemaFaq && (
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> FAQ Schema</span>
                )}
                {generatedArticle.schemaHowTo && (
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400" /> HowTo Schema</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`/admin/articles/${generatedArticle.id}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition inline-flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5" />
                Open Editor
              </a>
              <button
                onClick={resetWorkflow}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border transition"
                style={{ borderColor: 'var(--border)' }}
              >
                Back to List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="rounded-2xl border p-6 w-full max-w-sm shadow-2xl space-y-4"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Delete Article?</p>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteId('')}
                className="flex-1 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] border hover:bg-[var(--bg-card-hover)] transition"
                style={{ borderColor: 'var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
