'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { CALCULATORS } from '@/config/calculators';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutlineItem { heading: string; level: 'h2' | 'h3'; subpoints: string[]; }

interface KeywordOpportunity {
  keyword: string;
  type: 'calculator' | 'article';
  searchIntent: 'informational' | 'transactional';
  opportunityScore: number;
  estimatedMonthlySearches: string;
  keywordDifficulty: number;
  competitionLevel: 'low' | 'medium' | 'high';
  trendMomentum: 'rising' | 'stable' | 'declining';
  estimatedCtr: string;
  titles: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  intentAnalysis: string;
  outline: OutlineItem[];
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
}

interface FinderResult {
  opportunities: KeywordOpportunity[];
  rawSuggestions: string[];
  relatedSearches: string[];
  peopleAlsoAsk: string[];
  niche: string;
}

interface KeywordSuggestion {
  keyword: string;
  type: 'primary' | 'lsi' | 'question' | 'longtail' | 'comparison';
  relevanceScore: number;
  searchVolume: string;
  difficulty: 'easy' | 'medium' | 'hard';
  locked: boolean;
}

interface Article {
  id: string;
  calculatorId: string;
  slug: string;
  title: string;
  content: string;
  status: 'draft' | 'pending_review' | 'published';
  seoData: { title: string; description: string; keywords: string[]; canonicalUrl: string; };
  version: number;
  createdAt: string;
}

type SortKey = 'opportunityScore' | 'estimatedMonthlySearches' | 'keywordDifficulty' | 'competitionLevel';
type WorkspaceView = 'research' | 'opportunities' | 'keyword-builder' | 'generating' | 'editor' | 'drafts';

// ── Small helpers ─────────────────────────────────────────────────────────────

function titleToSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function kdColor(kd: number): string {
  if (kd <= 30) return 'text-green-500';
  if (kd <= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function kdLabel(kd: number): string {
  if (kd <= 30) return 'Easy';
  if (kd <= 60) return 'Medium';
  return 'Hard';
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function CompBadge({ level }: { level: string }) {
  const map: Record<string, string> = { low: 'bg-green-500/15 text-green-400', medium: 'bg-yellow-500/15 text-yellow-400', high: 'bg-red-500/15 text-red-400' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${map[level] ?? 'bg-gray-500/15 text-gray-400'}`}>{level}</span>;
}

function TrendBadge({ momentum }: { momentum: string }) {
  const map: Record<string, string> = { rising: 'bg-emerald-500/15 text-emerald-400', stable: 'bg-blue-500/15 text-blue-400', declining: 'bg-red-500/15 text-red-400' };
  const icon: Record<string, string> = { rising: '↑', stable: '→', declining: '↓' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[momentum] ?? 'bg-gray-500/15 text-gray-400'}`}>{icon[momentum] ?? ''} {momentum}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-green-500/15 text-green-400 border-green-500/20',
    pending_review: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    draft: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  };
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${map[status] ?? 'bg-gray-500/15 text-gray-400'}`}>{status.replace('_', ' ')}</span>;
}

function KdBar({ value }: { value: number }) {
  const color = value <= 30 ? '#22c55e' : value <= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div style={{ width: `${value}%`, backgroundColor: color }} className="h-full rounded-full transition-all" />
      </div>
      <span className={`text-xs font-bold ${kdColor(value)}`}>{value}</span>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <span className="text-sm font-black" style={{ color }}>{score}</span>
  );
}

function StepIndicator({ current }: { current: WorkspaceView }) {
  const steps: { id: WorkspaceView | string; label: string }[] = [
    { id: 'research', label: 'Research' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'keyword-builder', label: 'Keywords' },
    { id: 'generating', label: 'Generate' },
    { id: 'editor', label: 'Edit & Review' },
  ];
  const activeIndex = steps.findIndex((s) => s.id === current);
  if (current === 'drafts') return null;
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((step, i) => {
        const isActive = step.id === current;
        const isDone = i < activeIndex;
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition ${
              isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-green-500/20 text-green-400' : 'text-[var(--text-muted)]'
            }`}>
              {isDone ? '✓' : `${i + 1}`} {step.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px mx-1 ${i < activeIndex ? 'bg-green-500/40' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Opportunity Row (table) ────────────────────────────────────────────────────

function OpportunityRow({
  opp,
  onSelectTitle,
  expandedKeyword,
  onToggleExpand,
}: {
  opp: KeywordOpportunity;
  onSelectTitle: (opp: KeywordOpportunity, title: string) => void;
  expandedKeyword: string | null;
  onToggleExpand: (kw: string) => void;
}) {
  const isExpanded = expandedKeyword === opp.keyword;

  return (
    <>
      <tr
        className="border-b cursor-pointer hover:bg-[var(--bg-card-hover)] transition"
        style={{ borderColor: 'var(--border)' }}
        onClick={() => onToggleExpand(opp.keyword)}
      >
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{opp.keyword}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${opp.type === 'calculator' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                {opp.type === 'calculator' ? '🧮' : '✍️'} {opp.type}
              </span>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{opp.intentAnalysis.slice(0, 70)}…</span>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{opp.estimatedMonthlySearches}/mo</span>
        </td>
        <td className="px-4 py-3">
          <KdBar value={opp.keywordDifficulty} />
        </td>
        <td className="px-4 py-3 text-center">
          <CompBadge level={opp.competitionLevel} />
        </td>
        <td className="px-4 py-3 text-center">
          <ScorePill score={opp.opportunityScore} />
        </td>
        <td className="px-4 py-3 text-center">
          <TrendBadge momentum={opp.trendMomentum} />
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-xs font-bold text-blue-400">{opp.estimatedCtr ?? '—'}</span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{isExpanded ? '▲' : '▼'}</span>
        </td>
      </tr>

      {isExpanded && (
        <tr style={{ backgroundColor: 'var(--bg-input)' }}>
          <td colSpan={8} className="px-6 py-5">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Click a title to select it and auto-generate the SEO slug
              </p>
              <div className="grid gap-2">
                {opp.titles.map((title, i) => {
                  const slug = opp.urlSlug || titleToSlug(title);
                  return (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); onSelectTitle(opp, title); }}
                      className="group w-full text-left p-3 rounded-xl border hover:border-blue-500/40 hover:bg-blue-500/5 transition"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold group-hover:text-blue-400 transition" style={{ color: 'var(--text-primary)' }}>{title}</p>
                          <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>/{slug} · {title.length} chars</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition shrink-0">Select →</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Meta Preview</p>
                  <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <p className="text-xs font-bold text-blue-400 truncate">{opp.metaTitle}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{opp.metaDescription}</p>
                    <p className="text-[10px] font-mono mt-1 text-green-400">/{opp.urlSlug}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>LSI Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-600 text-white">{opp.primaryKeyword}</span>
                    {opp.secondaryKeywords.map((kw, j) => (
                      <span key={j} className="px-2 py-1 rounded-lg text-[10px] font-medium border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Keyword Builder ───────────────────────────────────────────────────────────

function KeywordBuilder({
  opp,
  selectedTitle,
  slug,
  onSlugChange,
  onGenerate,
  onBack,
}: {
  opp: KeywordOpportunity;
  selectedTitle: string;
  slug: string;
  onSlugChange: (s: string) => void;
  onGenerate: (lockedKeywords: string[]) => void;
  onBack: () => void;
}) {
  const [keywords, setKeywords] = useState<KeywordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [lockedSet, setLockedSet] = useState<Set<string>>(new Set([opp.primaryKeyword, ...opp.secondaryKeywords]));
  const [fetched, setFetched] = useState(false);

  const toggleLock = (kw: string) => {
    setLockedSet((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) {
        next.delete(kw);
      } else {
        next.add(kw);
      }
      return next;
    });
  };

  const fetchKeywords = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seo-finder/title-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTitle,
          keyword: opp.keyword,
          existingKeywords: [...lockedSet],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setKeywords(data.keywords);
      setFetched(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch keyword suggestions');
    } finally {
      setLoading(false);
    }
  }, [selectedTitle, opp.keyword, lockedSet, fetched]);

  useEffect(() => { fetchKeywords(); }, []);

  const typeColors: Record<string, string> = {
    primary: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    lsi: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    question: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    longtail: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    comparison: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  };

  const diffColors: Record<string, string> = { easy: 'text-green-400', medium: 'text-yellow-400', hard: 'text-red-400' };

  const lockedKeywords = [...lockedSet];

  return (
    <div className="space-y-6">
      {/* Selected title + slug */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">✓</div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Selected Article Title</p>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTitle}</h2>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>SEO URL Slug (auto-generated · editable)</label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, ''))}
              className="flex-1 px-3 py-2 border rounded-xl text-xs font-mono outline-none"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Locked (seed) keywords */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>🔒 Locked Keywords</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>These keywords from the opportunity are locked by default. Click any additional suggestion below to add it.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lockedKeywords.map((kw) => (
            <span key={kw} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30">
              🔒 {kw}
            </span>
          ))}
        </div>
      </div>

      {/* AI keyword suggestions */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
              AI Keyword Suggestions for This Title
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Generated from Google Autocomplete + AI analysis. Click to add to locked set.
            </p>
          </div>
          {fetched && (
            <button
              onClick={() => { setFetched(false); fetchKeywords(); }}
              className="text-[10px] font-bold text-blue-500 hover:underline"
            >
              Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Analyzing title for keyword opportunities…</span>
          </div>
        ) : keywords.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data available</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {keywords
              .sort((a, b) => b.relevanceScore - a.relevanceScore)
              .map((kw) => {
                const isLocked = lockedSet.has(kw.keyword);
                return (
                  <button
                    key={kw.keyword}
                    onClick={() => toggleLock(kw.keyword)}
                    className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-[var(--bg-card-hover)] transition"
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${isLocked ? 'bg-blue-600 border-blue-600' : 'border-[var(--border)]'}`}>
                      {isLocked && <span className="text-white text-[10px] font-black">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{kw.keyword}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${typeColors[kw.type] ?? 'bg-gray-500/15 text-gray-400'}`}>{kw.type}</span>
                        {isLocked && <span className="text-[9px] font-black text-blue-400">LOCKED</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{kw.searchVolume}/mo</span>
                      <span className={`text-[10px] font-bold ${diffColors[kw.difficulty] ?? 'text-gray-400'}`}>{kw.difficulty}</span>
                      <span className="text-[10px] font-bold text-blue-400">{kw.relevanceScore}</span>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--bg-card-hover)] transition" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{lockedKeywords.length} keywords locked</span>
          <button
            onClick={() => onGenerate(lockedKeywords)}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-purple-600/20 flex items-center gap-2"
          >
            ✍️ Generate Article
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Article Editor ────────────────────────────────────────────────────────────

function ArticleEditor({ article, onSave, onCancel }: {
  article: Partial<Article>;
  onSave: (updated: Partial<Article>) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Article>>(article);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview' | 'split'>('split');

  const wordCount = useMemo(() =>
    (draft.content ?? '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length,
    [draft.content]);
  const readingTime = Math.max(1, Math.round(wordCount / 238));

  const detectedLinks = CALCULATORS.filter((c) => {
    const content = draft.content ?? '';
    return content.includes(`/${c.slug}`) || content.toLowerCase().includes(c.name.toLowerCase());
  });

  const handleTitleChange = (t: string) => {
    const autoSlug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setDraft((d) => ({ ...d, title: t, slug: d.slug || autoSlug }));
  };

  const handleSubmit = async (status?: Article['status']) => {
    setSaving(true);
    try { await onSave(status ? { ...draft, status } : draft); }
    finally { setSaving(false); }
  };

  const injectLink = (calc: typeof CALCULATORS[0]) => {
    const linkHtml = `<a href="/${calc.slug}" title="${calc.name}">${calc.name}</a>`;
    const regex = new RegExp(`(?<!href=["'][^"']*)\\b(${calc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^<]*>)`, 'i');
    const newContent = (draft.content ?? '').replace(regex, linkHtml);
    if (newContent !== draft.content) {
      setDraft((d) => ({ ...d, content: newContent }));
      toast.success(`Linked "${calc.name}"`);
    } else {
      setDraft((d) => ({ ...d, content: (d.content ?? '') + `\n<p>Use our free <a href="/${calc.slug}">${calc.name}</a> for instant results.</p>` }));
      toast.success(`Appended link to "${calc.name}"`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Editor header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-xs font-bold hover:text-[var(--text-primary)] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>← Drafts</button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <h2 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{draft.id ? `Editing: ${draft.title || 'Untitled'}` : 'New Article'}</h2>
          {draft.status && <StatusBadge status={draft.status} />}
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{wordCount.toLocaleString()} words · {readingTime} min read</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(['editor', 'split', 'preview'] as const).map((m) => (
            <button key={m} onClick={() => setPreviewMode(m)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition ${previewMode === m ? 'bg-blue-600 text-white border-blue-600' : 'border-[var(--border)] hover:bg-[var(--bg-card-hover)]'}`}
              style={{ color: previewMode === m ? undefined : 'var(--text-muted)' }}>
              {m === 'split' ? '⊞ Split' : m === 'editor' ? '✏ Code' : '👁 Preview'}
            </button>
          ))}
        </div>
      </div>

      {/* Meta fields */}
      <div className="rounded-2xl border p-5 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {[
          { label: 'Article Title *', key: 'title', placeholder: 'Article title…', onChange: (v: string) => handleTitleChange(v) },
          { label: 'URL Slug', key: 'slug', placeholder: 'seo-url-slug', mono: true, onChange: (v: string) => setDraft((d) => ({ ...d, slug: v })) },
        ].map(({ label, key, placeholder, mono, onChange }) => (
          <div key={key}>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
            <input type="text" value={(draft as Record<string, string>)[key] ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
              className={`w-full p-3 border rounded-xl outline-none text-sm ${mono ? 'font-mono' : ''}`}
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>
        ))}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Meta Title</label>
          <input type="text" value={draft.seoData?.title || ''} placeholder="SEO meta title (≤60 chars)"
            onChange={(e) => setDraft((d) => ({ ...d, seoData: { ...d.seoData!, title: e.target.value } }))}
            className="w-full p-3 border rounded-xl outline-none text-sm" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          <p className={`text-[10px] mt-1 ${(draft.seoData?.title?.length ?? 0) > 60 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{draft.seoData?.title?.length ?? 0}/60</p>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Meta Description</label>
          <input type="text" value={draft.seoData?.description || ''} placeholder="SEO meta description (≤155 chars)"
            onChange={(e) => setDraft((d) => ({ ...d, seoData: { ...d.seoData!, description: e.target.value } }))}
            className="w-full p-3 border rounded-xl outline-none text-sm" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          <p className={`text-[10px] mt-1 ${(draft.seoData?.description?.length ?? 0) > 155 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{draft.seoData?.description?.length ?? 0}/155</p>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Link to Calculator</label>
          <select value={draft.calculatorId || ''} onChange={(e) => setDraft((d) => ({ ...d, calculatorId: e.target.value }))}
            className="w-full p-3 border rounded-xl outline-none text-sm cursor-pointer" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <option value="">No link (General article)</option>
            {CALCULATORS.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Publishing Status</label>
          <select value={draft.status || 'draft'} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Article['status'] }))}
            className="w-full p-3 border rounded-xl outline-none text-sm cursor-pointer" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <option value="draft">Draft (Private)</option>
            <option value="pending_review">Pending Review</option>
            <option value="published">Published (Public)</option>
          </select>
        </div>
      </div>

      {/* Split editor / preview */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className={`flex ${previewMode === 'split' ? 'flex-col md:flex-row' : 'flex-col'}`} style={{ minHeight: 560 }}>
          {(previewMode === 'editor' || previewMode === 'split') && (
            <div className={`flex flex-col ${previewMode === 'split' ? 'md:w-1/2 border-r' : 'w-full'}`} style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>HTML Source</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{wordCount.toLocaleString()} words</span>
              </div>
              <textarea value={draft.content || ''} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                placeholder="Article HTML content…"
                className="flex-1 w-full p-4 outline-none text-xs font-mono leading-relaxed resize-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: 520 }} />
            </div>
          )}
          {(previewMode === 'preview' || previewMode === 'split') && (
            <div className={`flex flex-col ${previewMode === 'split' ? 'md:w-1/2' : 'w-full'}`}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Rendered Preview · {readingTime} min read</span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto prose prose-sm max-w-none" style={{ minHeight: 520, color: 'var(--text-primary)' }}
                dangerouslySetInnerHTML={{ __html: draft.content || '<p style="color:var(--text-muted);font-style:italic;">Start typing to see a live preview…</p>' }} />
            </div>
          )}
        </div>
      </div>

      {/* Internal Link Mapper */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>🔗 Internal Link Mapper</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {detectedLinks.length > 0 ? `${detectedLinks.length} calculator${detectedLinks.length !== 1 ? 's' : ''} linked` : 'No calculator links detected — click below to inject'}
            </p>
          </div>
          {detectedLinks.length > 0 && <span className="text-[10px] font-black text-green-400">{detectedLinks.length} linked ✓</span>}
        </div>
        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
          {CALCULATORS.map((c) => {
            const linked = detectedLinks.some((d) => d.slug === c.slug);
            return (
              <button key={c.slug} onClick={() => injectLink(c)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${linked ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-[var(--border)] hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5'}`}
                style={{ color: linked ? undefined : 'var(--text-secondary)' }}>
                {c.icon} {c.shortName} {linked ? '✓' : '+'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onCancel} className="px-5 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--bg-card-hover)] transition" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>← Back</button>
        <div className="flex items-center gap-3">
          <button disabled={saving} onClick={() => handleSubmit('draft')}
            className="px-5 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--bg-card-hover)] transition disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {saving ? '⏳ Saving…' : '💾 Save Draft'}
          </button>
          <button disabled={saving} onClick={() => handleSubmit('pending_review')}
            className="px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-yellow-500/20 transition disabled:opacity-50">
            📋 Send for Review
          </button>
          <button disabled={saving || !draft.title || !draft.content} onClick={() => handleSubmit('published')}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-green-600/20 disabled:opacity-50">
            {saving ? '⏳…' : '🚀 Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Article List Row ──────────────────────────────────────────────────────────

function ArticleRow({ article, onEdit, onDelete, onPublish }: {
  article: Article;
  onEdit: (a: Article) => void;
  onDelete: (id: string) => void;
  onPublish: (a: Article) => void;
}) {
  const wordCount = article.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 238));
  const linkedCalc = CALCULATORS.find((c) => c.slug === article.calculatorId);

  return (
    <div className="px-5 py-4 flex items-center gap-4 hover:bg-[var(--bg-card-hover)] transition">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{article.title}</span>
          <StatusBadge status={article.status} />
        </div>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span className="font-mono">/blog/{article.slug}</span>
          {linkedCalc && <span className="ml-3 text-blue-400">🔗 {linkedCalc.name}</span>}
          <span className="ml-3">{wordCount.toLocaleString()} words · {readingTime} min</span>
          <span className="ml-3">v{article.version}</span>
          <span className="ml-3">{new Date(article.createdAt).toLocaleDateString()}</span>
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {article.status !== 'published' && (
          <button onClick={() => onPublish(article)} className="text-xs font-bold text-green-400 hover:underline">Publish</button>
        )}
        <button onClick={() => onEdit(article)} className="text-xs font-bold text-blue-400 hover:underline">Edit</button>
        <span style={{ color: 'var(--border)' }}>|</span>
        <button onClick={() => onDelete(article.id)} className="text-xs font-bold text-red-400 hover:underline">Delete</button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const NICHES = ['Finance', 'Health & Fitness', 'Real Estate', 'Mortgage', 'Education', 'Lifestyle', 'Math & Science', 'Tax & Accounting'];
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'opportunityScore', label: '↓ Opportunity Score' },
  { key: 'estimatedMonthlySearches', label: '↓ Search Volume' },
  { key: 'keywordDifficulty', label: '↑ Lowest Difficulty' },
  { key: 'competitionLevel', label: '↑ Lowest Competition' },
];

export default function AiArticlesManagerPage() {
  const [view, setView] = useState<WorkspaceView>('research');

  // Research
  const [niche, setNiche] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [result, setResult] = useState<FinderResult | null>(null);

  // Opportunities
  const [sortKey, setSortKey] = useState<SortKey>('opportunityScore');
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);

  // Selected title / keyword builder
  const [selectedOpp, setSelectedOpp] = useState<KeywordOpportunity | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [editableSlug, setEditableSlug] = useState('');

  // Generation
  const [generatingFor, setGeneratingFor] = useState('');
  const [generationMeta, setGenerationMeta] = useState<Record<string, unknown> | null>(null);

  // Drafts / editor
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch('/api/admin/blog');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load articles'); }
    finally { setLoadingArticles(false); }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const sortedOpportunities = useMemo(() => {
    if (!result) return [];
    return [...result.opportunities].sort((a, b) => {
      if (sortKey === 'opportunityScore') return b.opportunityScore - a.opportunityScore;
      if (sortKey === 'keywordDifficulty') return a.keywordDifficulty - b.keywordDifficulty;
      if (sortKey === 'competitionLevel') {
        const order = { low: 0, medium: 1, high: 2 };
        return (order[a.competitionLevel] ?? 1) - (order[b.competitionLevel] ?? 1);
      }
      if (sortKey === 'estimatedMonthlySearches') {
        const parse = (s: string) => parseInt(s.replace(/[^0-9]/g, '')) || 0;
        return parse(b.estimatedMonthlySearches) - parse(a.estimatedMonthlySearches);
      }
      return 0;
    });
  }, [result, sortKey]);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;
    setDiscovering(true);
    setResult(null);
    setExpandedKeyword(null);
    try {
      const res = await fetch('/api/admin/seo-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Discovery failed');
      setResult(data);
      setView('opportunities');
      toast.success(`Found ${data.opportunities.length} keyword opportunities`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const handleSelectTitle = (opp: KeywordOpportunity, title: string) => {
    setSelectedOpp(opp);
    setSelectedTitle(title);
    setEditableSlug(opp.urlSlug || titleToSlug(title));
    setView('keyword-builder');
  };

  const handleGenerate = async (lockedKeywords: string[]) => {
    if (!selectedOpp) return;
    setGeneratingFor(selectedTitle);
    setView('generating');
    try {
      const res = await fetch('/api/admin/seo-finder/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: selectedOpp.keyword,
          primaryKeyword: selectedOpp.primaryKeyword,
          secondaryKeywords: selectedOpp.secondaryKeywords,
          selectedTitle,
          intentAnalysis: selectedOpp.intentAnalysis,
          outline: selectedOpp.outline,
          metaTitle: selectedOpp.metaTitle,
          metaDescription: selectedOpp.metaDescription,
          urlSlug: editableSlug,
          lockedKeywords,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setGenerationMeta(d.meta);
        await fetchArticles();
        toast.success(`"${d.article.title}" saved as Draft`);
        setEditingArticle(d.article as Article);
        setView('editor');
      } else {
        toast.error(d.error || 'Failed to generate article');
        setView('keyword-builder');
      }
    } catch {
      toast.error('Failed to generate article');
      setView('keyword-builder');
    } finally {
      setGeneratingFor('');
    }
  };

  const handleEdit = (article: Article) => { setEditingArticle({ ...article }); setView('editor'); };
  const handleCreateNew = () => {
    setEditingArticle({ title: '', slug: '', content: '', status: 'draft', calculatorId: '', seoData: { title: '', description: '', keywords: [], canonicalUrl: '' } });
    setView('editor');
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
      if (res.ok) { setArticles((prev) => prev.filter((a) => a.id !== id)); toast.success('Article deleted'); }
      else toast.error('Delete failed');
    } catch { toast.error('An error occurred'); }
  };
  const handlePublish = async (article: Article) => {
    const res = await fetch('/api/admin/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...article, status: 'published' }) });
    if (res.ok) { const d = await res.json(); setArticles((prev) => prev.map((a) => a.id === d.article.id ? d.article : a)); toast.success('Article published'); }
    else toast.error('Publish failed');
  };
  const handleSaveArticle = async (updated: Partial<Article>) => {
    if (!updated.title || !updated.content) { toast.error('Title and content are required'); return; }
    const res = await fetch('/api/admin/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
    if (res.ok) {
      const d = await res.json();
      setArticles((prev) => { const idx = prev.findIndex((a) => a.id === d.article.id); return idx > -1 ? prev.map((a) => a.id === d.article.id ? d.article : a) : [d.article, ...prev]; });
      toast.success(updated.id ? 'Article updated' : 'Article created');
      setEditingArticle(null);
      setView('drafts');
    } else toast.error('Failed to save article');
  };

  const statusCounts = { all: articles.length, published: articles.filter((a) => a.status === 'published').length, draft: articles.filter((a) => a.status === 'draft').length, pending: articles.filter((a) => a.status === 'pending_review').length };

  return (
    <div className="space-y-6">

      {/* Generation overlay */}
      {view === 'generating' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="flex flex-col items-center gap-5 max-w-md text-center px-8">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-3xl">✍️</span>
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tight">Generating Article</p>
              <p className="text-purple-300 text-sm mt-1 font-medium">"{generatingFor}"</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/50">
                {['Writing 1,600–2,200 words', 'Building Key Takeaways', 'Generating TOC', 'Adding FAQ Schema', 'HowTo JSON-LD', 'Internal link injection', 'Article JSON-LD', 'OpenGraph meta'].map((s) => (
                  <div key={s} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />{s}</div>
                ))}
              </div>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: '65%' }} />
            </div>
            <p className="text-white/30 text-[10px]">Article always saved as Draft first · Never auto-published</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>AI Articles Manager</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Keyword research → Title selection → Keyword builder → AI generation → Review & Publish
          </p>
        </div>
        <div className="flex items-center gap-2">
          {result && view !== 'research' && (
            <button onClick={() => setView('opportunities')} className="px-3 py-2 text-xs font-bold border rounded-xl hover:bg-[var(--bg-card-hover)] transition" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              ← Opportunities
            </button>
          )}
          <button onClick={() => setView('research')} className={`px-3 py-2 text-xs font-bold border rounded-xl transition ${view === 'research' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-[var(--bg-card-hover)]'}`} style={{ borderColor: view === 'research' ? undefined : 'var(--border)', color: view === 'research' ? undefined : 'var(--text-secondary)' }}>
            🔍 Research
          </button>
          <button onClick={() => { fetchArticles(); setView('drafts'); }}
            className={`px-3 py-2 text-xs font-bold border rounded-xl transition flex items-center gap-2 ${view === 'drafts' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-[var(--bg-card-hover)]'}`}
            style={{ borderColor: view === 'drafts' ? undefined : 'var(--border)', color: view === 'drafts' ? undefined : 'var(--text-secondary)' }}>
            ✍️ Drafts
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${view === 'drafts' ? 'bg-white/20' : 'bg-[var(--bg-input)]'}`}>{statusCounts.all}</span>
          </button>
          {view === 'drafts' && (
            <button onClick={handleCreateNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/20">
              + New
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      {view !== 'drafts' && view !== 'editor' && <StepIndicator current={view} />}

      {/* ── Research View ──────────────────────────────────────────────────────── */}
      {view === 'research' && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">Live Keyword Research</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Sources: Google Autocomplete · People Also Ask · DuckDuckGo Related Searches · AI Opportunity Scoring
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <button key={n} onClick={() => setNiche(n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${niche === n ? 'bg-blue-600 text-white border-blue-600' : 'border-[var(--border)] hover:bg-[var(--bg-card-hover)]'}`}
                  style={{ color: niche === n ? undefined : 'var(--text-secondary)' }}>
                  {n}
                </button>
              ))}
            </div>
            <form onSubmit={handleDiscover} className="flex gap-3">
              <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Enter a niche, topic, or seed keyword…" disabled={discovering}
                className="flex-1 p-3 border rounded-xl outline-none text-sm" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              <button type="submit" disabled={discovering || !niche.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/25 whitespace-nowrap">
                {discovering ? '⏳ Analyzing…' : '🔍 Discover'}
              </button>
            </form>

            {discovering && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Pipeline Running</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {['Fetching Google Autocomplete', 'Fetching DuckDuckGo Related Searches', 'Simulating People Also Ask', 'AI opportunity scoring & metrics'].map((s) => (
                    <div key={s} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Data sources info */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🔎', label: 'Google Autocomplete', desc: 'Real-time queries from Google Suggest API across 5 query variations' },
              { icon: '❓', label: 'People Also Ask', desc: 'Question-prefix autocomplete simulating PAA patterns (who/what/how/why/when)' },
              { icon: '🔗', label: 'Related Searches', desc: 'DuckDuckGo instant answer API for semantically related topics' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                </div>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Opportunities View ─────────────────────────────────────────────────── */}
      {view === 'opportunities' && result && (
        <div className="space-y-5">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Opportunities', value: result.opportunities.length, color: 'text-blue-400' },
              { label: 'Calculator Ideas', value: result.opportunities.filter((o) => o.type === 'calculator').length, color: 'text-blue-400' },
              { label: 'Article Ideas', value: result.opportunities.filter((o) => o.type === 'article').length, color: 'text-purple-400' },
              { label: 'Avg Opp. Score', value: Math.round(result.opportunities.reduce((s, o) => s + o.opportunityScore, 0) / result.opportunities.length), color: 'text-green-400' },
              { label: 'Avg KD', value: Math.round(result.opportunities.reduce((s, o) => s + (o.keywordDifficulty || 0), 0) / result.opportunities.length), color: 'text-yellow-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Raw data sources */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '📡 Autocomplete Queries', items: result.rawSuggestions },
              { label: '❓ People Also Ask', items: result.peopleAlsoAsk },
              { label: '🔗 Related Searches', items: result.relatedSearches },
            ].map(({ label, items }) => (
              <div key={label} className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
                {items.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data available</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {items.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sort controls */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {sortedOpportunities.length} Keyword Opportunities · Click any row to expand titles
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sort by:</span>
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => setSortKey(opt.key)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${sortKey === opt.key ? 'bg-blue-600 text-white border-blue-600' : 'border-[var(--border)] hover:bg-[var(--bg-card-hover)]'}`}
                  style={{ color: sortKey === opt.key ? undefined : 'var(--text-secondary)' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities table */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                    {['Keyword / Intent', 'Search Volume', 'Keyword Difficulty', 'Competition', 'Opp. Score', 'Trend', 'Est. CTR', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedOpportunities.map((opp) => (
                    <OpportunityRow
                      key={opp.keyword}
                      opp={opp}
                      onSelectTitle={handleSelectTitle}
                      expandedKeyword={expandedKeyword}
                      onToggleExpand={(kw) => setExpandedKeyword(expandedKeyword === kw ? null : kw)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyword Builder View ───────────────────────────────────────────────── */}
      {view === 'keyword-builder' && selectedOpp && (
        <KeywordBuilder
          opp={selectedOpp}
          selectedTitle={selectedTitle}
          slug={editableSlug}
          onSlugChange={setEditableSlug}
          onGenerate={handleGenerate}
          onBack={() => setView('opportunities')}
        />
      )}

      {/* ── Editor View ───────────────────────────────────────────────────────── */}
      {view === 'editor' && editingArticle && (
        <div>
          {/* Generation success info */}
          {generationMeta && (
            <div className="mb-4 p-4 rounded-2xl border bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-black text-green-400">✓ Article Generated as Draft</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {String(generationMeta.wordCount)} words · {String(generationMeta.readingTime)} min read ·{' '}
                  {String(generationMeta.faqCount)} FAQs ·{' '}
                  {generationMeta.hasToc ? 'TOC ✓' : ''} ·{' '}
                  Schema: {(generationMeta.schemaTypes as string[]).join(', ')}
                </span>
                <span className="text-[10px] font-bold text-yellow-400">Review before publishing →</span>
              </div>
            </div>
          )}
          <ArticleEditor
            article={editingArticle}
            onSave={handleSaveArticle}
            onCancel={() => { setEditingArticle(null); setGenerationMeta(null); setView('drafts'); }}
          />
        </div>
      )}

      {/* ── Drafts View ───────────────────────────────────────────────────────── */}
      {view === 'drafts' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: statusCounts.all, color: 'text-blue-400' },
              { label: 'Published', value: statusCounts.published, color: 'text-green-400' },
              { label: 'Pending Review', value: statusCounts.pending, color: 'text-yellow-400' },
              { label: 'Drafts', value: statusCounts.draft, color: 'text-gray-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value || 'No data available'}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {loadingArticles ? (
              <div className="p-12 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading articles…</span>
              </div>
            ) : articles.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-4xl">✍️</div>
                <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>No articles yet</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Use{' '}<button onClick={() => setView('research')} className="text-blue-400 hover:underline">Keyword Research</button>{' '}to generate AI articles, or create one manually.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {articles.map((art) => (
                  <ArticleRow key={art.id} article={art} onEdit={handleEdit} onDelete={handleDelete} onPublish={handlePublish} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
