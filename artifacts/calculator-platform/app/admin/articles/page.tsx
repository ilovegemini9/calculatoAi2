'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart2,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  Info,
  Layers,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wand2,
  X,
  XCircle,
  Zap,
  PenLine,
  Calculator,
} from 'lucide-react';
import type {
  Article,
  ArticleAutoSeoData,
  ArticleOutlineSection,
  ArticleResearchSummary,
  ResearchKeywordChip,
  ResearchTitleCard,

} from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'researching'
  | 'selecting-keyword'
  | 'loading-titles'
  | 'selecting-title'
  | 'loading-content'
  | 'editing-outline'
  | 'generating'
  | 'done';

type WorkflowAction = 'draft' | 'review' | 'publish';
type Working = 'research' | 'titles' | 'content' | 'slug' | 'generate' | WorkflowAction | null;
type NoticeKind = 'success' | 'error' | 'info';

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTION_TYPES: ArticleOutlineSection['type'][] = [
  'h2', 'h3', 'faq', 'howto', 'examples', 'comparison', 'proscons', 'internal-links', 'related',
];

const SECTION_LABELS: Record<ArticleOutlineSection['type'], string> = {
  h2: 'H2', h3: 'H3', faq: 'FAQ', howto: 'How-To', examples: 'Examples',
  comparison: 'Compare', proscons: 'Pros & Cons', 'internal-links': 'Links', related: 'Related',
};

const SECTION_COLORS: Record<ArticleOutlineSection['type'], string> = {
  h2: 'bg-blue-500/10 text-blue-500',
  h3: 'bg-violet-500/10 text-violet-500',
  faq: 'bg-amber-500/10 text-amber-600',
  howto: 'bg-green-500/10 text-green-600',
  examples: 'bg-cyan-500/10 text-cyan-600',
  comparison: 'bg-orange-500/10 text-orange-600',
  proscons: 'bg-rose-500/10 text-rose-600',
  'internal-links': 'bg-slate-500/10 text-slate-500',
  related: 'bg-teal-500/10 text-teal-600',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SLUG_STOP_WORDS = new Set([
  'a','an','the','and','or','but','for','nor','so','yet','to','of','in',
  'on','at','by','up','as','is','are','was','be','do','it','its','this',
  'that','with','from','into','how','what','why','when','where','who',
  'which','your','you','our','we','they','their','will','can','may','has',
  'have','had','not','all','more','about','get','use','using','do','does',
]);

function slugify(value: string): string {
  const words = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !SLUG_STOP_WORDS.has(w));
  return words.join('-').replace(/-+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
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

// ─── UI primitives ────────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15';
const inputStyle = { borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };

function Notice({ kind, children }: { kind: NoticeKind; children: React.ReactNode }) {
  const map: Record<NoticeKind, { cls: string; Icon: React.ElementType }> = {
    success: { cls: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400', Icon: CheckCircle2 },
    error: { cls: 'border-red-500/25 bg-red-500/8 text-red-600 dark:text-red-400', Icon: XCircle },
    info: { cls: 'border-blue-500/25 bg-blue-500/8 text-blue-600 dark:text-blue-400', Icon: Info },
  };
  const { cls, Icon } = map[kind];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function StepCard({ number, title, description, locked, active, children }: {
  number: string; title: string; description: string; locked?: boolean; active?: boolean; children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border transition-all duration-200 ${locked ? 'opacity-40 pointer-events-none select-none' : ''} ${active ? 'ring-2 ring-blue-500/30' : ''}`}
      style={{ borderColor: active ? 'var(--blue-500, #3b82f6)' : 'var(--border)', backgroundColor: 'var(--bg-card)' }}
    >
      <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${active ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-500'}`}>{number}</span>
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


function GhostButton({ onClick, disabled, loading, children }: {
  onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ borderColor: 'var(--border)' }}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Metric display ───────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string | null }) {
  if (!trend) return null;
  if (trend === 'Rising') return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trend === 'Declining') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <BarChart2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />;
}

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return null;
  const color = score >= 70 ? 'bg-emerald-500/10 text-emerald-600' : score >= 45 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      <Zap className="h-3 w-3" /> {score}
    </span>
  );
}

function CompetitionBadge({ competition }: { competition: string | null }) {
  if (!competition) return null;
  const color = competition === 'Low' ? 'bg-emerald-500/10 text-emerald-600' : competition === 'Medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>{competition}</span>;
}

// ─── Keyword Chip Card ────────────────────────────────────────────────────────

function KeywordChipCard({ chip, selected, locked, onClick }: {
  chip: ResearchKeywordChip; selected: boolean; locked: boolean; onClick: () => void;
}) {
  const hasMetrics = chip.searchVolumeLabel || chip.competition || chip.trend;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked && !selected}
      className={`group w-full rounded-xl border text-left transition-all duration-200 ${
        selected
          ? 'border-blue-500 bg-blue-500/8 shadow-md shadow-blue-500/10'
          : locked
          ? 'pointer-events-none opacity-35'
          : 'hover:border-blue-400/60 hover:bg-blue-500/3'
      }`}
      style={{ borderColor: selected ? undefined : 'var(--border)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold truncate ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-primary)]'}`}>
            {chip.keyword}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {chip.searchVolumeLabel && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Search className="h-3 w-3" />{chip.searchVolumeLabel}
              </span>
            )}
            <CompetitionBadge competition={chip.competition} />
            {chip.trend && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <TrendIcon trend={chip.trend} />{chip.trend}
              </span>
            )}
            {!hasMetrics && (
              <span className="text-xs italic text-[var(--text-muted)]">Live data unavailable</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ScoreBadge score={chip.opportunityScore} />
          {selected
            ? <span className="flex items-center gap-1.5 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                <Check className="h-3 w-3" /> Selected
              </span>
            : <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-blue-500" />}
        </div>
      </div>
    </button>
  );
}

// ─── Title Card ───────────────────────────────────────────────────────────────

function TitleCardItem({ card, selected, onClick }: {
  card: ResearchTitleCard; selected: boolean; onClick: () => void;
}) {
  const hasMetrics = card.searchVolumeLabel || card.competition || card.trend || card.opportunityScore !== null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border text-left transition ${selected
        ? 'border-blue-500 bg-blue-500/5 shadow-sm shadow-blue-500/10'
        : 'hover:border-blue-400/60 hover:bg-blue-500/3'
        }`}
      style={{ borderColor: selected ? undefined : 'var(--border)' }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">{card.title}</p>
          <div className="flex shrink-0 items-center gap-2">
            {selected
              ? <span className="flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-semibold text-white"><Check className="h-3 w-3" /> Selected</span>
              : <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-blue-500" />}
          </div>
        </div>
        {hasMetrics ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {card.searchVolumeLabel && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Search className="h-3 w-3" /> {card.searchVolumeLabel}
              </span>
            )}
            <CompetitionBadge competition={card.competition} />
            {card.trend && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <TrendIcon trend={card.trend} /> {card.trend}
              </span>
            )}
            <ScoreBadge score={card.opportunityScore} />
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic">Live search data unavailable.</p>
        )}
      </div>
    </button>
  );
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────

function OpportunityCard({ title, selected, locked, onClick }: {
  title: string; selected: boolean; locked: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked && !selected}
      className={`group w-full rounded-2xl border text-left transition-all duration-200 ${
        selected
          ? 'border-blue-500 bg-blue-500/8 shadow-md shadow-blue-500/10'
          : locked
          ? 'pointer-events-none opacity-40'
          : 'hover:border-blue-400/60 hover:bg-blue-500/3'
      }`}
      style={{ borderColor: selected ? undefined : 'var(--border)' }}
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <p className={`text-sm font-semibold leading-snug ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-primary)]'}`}>
          {title}
        </p>
        <div className="shrink-0">
          {selected
            ? <span className="flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white"><Check className="h-3 w-3" /> Selected</span>
            : <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-blue-500" />}
        </div>
      </div>
    </button>
  );
}

// ─── Research Summary ─────────────────────────────────────────────────────────

function ResearchSummary({ research }: { research: ArticleResearchSummary }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
      <button type="button" onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-[var(--text-primary)]">Research Complete</span>
          {research.serpDataAvailable
            ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">Live SerpAPI data</span>
            : <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">Free sources only</span>}
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />}
      </button>
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--border)' }}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Organic Results', value: research.organicCount },
              { label: 'PAA Questions', value: research.paaQuestions.length },
              { label: 'Related Searches', value: research.relatedSearches.length },
              { label: 'Featured Snippet', value: research.hasFeaturedSnippet ? 'Yes' : 'No' },
              { label: 'Reddit Discussions', value: research.redditCount },
              { label: 'Trend', value: research.trendDirection ? `${research.trendDirection.charAt(0).toUpperCase() + research.trendDirection.slice(1)} (${research.trendInterest ?? '?'}/100)` : 'Unavailable' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border p-2.5" style={{ borderColor: 'var(--border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>
          {research.paaQuestions.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">People Also Ask</p>
              <ul className="space-y-1">
                {research.paaQuestions.slice(0, 5).map((q, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)] before:mr-1.5 before:content-['?'] before:text-blue-400">{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SEO Data Panel ───────────────────────────────────────────────────────────

function SeoDataPanel({ seoData }: { seoData: ArticleAutoSeoData }) {
  const groups = [
    {
      icon: Target,
      label: 'Focus Keyword',
      color: 'text-blue-500',
      bg: 'bg-blue-500/8',
      content: (
        <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
          {seoData.focusKeyword}
        </span>
      ),
    },
    {
      icon: Tag,
      label: 'Secondary Keywords',
      color: 'text-violet-500',
      bg: 'bg-violet-500/8',
      content: (
        <div className="flex flex-wrap gap-1.5">
          {seoData.secondaryKeywords.map((kw) => (
            <span key={kw} className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-600 dark:text-violet-400">{kw}</span>
          ))}
        </div>
      ),
    },
    {
      icon: Search,
      label: 'Long-Tail Keywords',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/8',
      content: (
        <div className="flex flex-wrap gap-1.5">
          {seoData.longTailKeywords.map((kw) => (
            <span key={kw} className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">{kw}</span>
          ))}
        </div>
      ),
    },
    {
      icon: Layers,
      label: 'Semantic Keywords',
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/8',
      content: (
        <div className="flex flex-wrap gap-1.5">
          {seoData.semanticKeywords.map((kw) => (
            <span key={kw} className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-400">{kw}</span>
          ))}
        </div>
      ),
    },
    {
      icon: Globe,
      label: 'Entity Keywords',
      color: 'text-teal-500',
      bg: 'bg-teal-500/8',
      content: (
        <div className="flex flex-wrap gap-1.5">
          {seoData.entityKeywords.map((kw) => (
            <span key={kw} className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-600 dark:text-teal-400">{kw}</span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Keyword groups */}
      {groups.map(({ icon: Icon, label, color, content }) => (
        <div key={label}>
          <div className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${color}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </div>
          {content}
        </div>
      ))}

      {/* Intent / Audience / Angle row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Brain, label: 'User Intent', color: 'text-amber-500', value: seoData.userIntent, badge: null },
          { icon: Users, label: 'Target Audience', color: 'text-orange-500', value: seoData.targetAudience, badge: null },
          {
            icon: Sparkles, label: 'Search Intent', color: 'text-pink-500', value: seoData.contentAngle,
            badge: (
              <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold capitalize text-pink-600">{seoData.searchIntent}</span>
            ),
          },
        ].map(({ icon: Icon, label, color, value, badge }) => (
          <div key={label} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
            <div className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${color}`}>
              <Icon className="h-3 w-3" /> {label}
              {badge && <span className="ml-auto">{badge}</span>}
            </div>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Outline Editor ───────────────────────────────────────────────────────────

function OutlineEditor({ outline, onChange }: { outline: ArticleOutlineSection[]; onChange: (updated: ArticleOutlineSection[]) => void }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => { const next = new Set(prev); if (next.has(id)) { next.delete(id); } else { next.add(id); } return next; });
  };
  const updateSection = (id: string, patch: Partial<ArticleOutlineSection>) => {
    onChange(outline.map((s) => s.id === id ? { ...s, ...patch } : s));
  };
  const cycleType = (id: string, currentType: ArticleOutlineSection['type']) => {
    const idx = SECTION_TYPES.indexOf(currentType);
    updateSection(id, { type: SECTION_TYPES[(idx + 1) % SECTION_TYPES.length] });
  };
  const move = (id: string, dir: 'up' | 'down') => {
    const idx = outline.findIndex((s) => s.id === id);
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === outline.length - 1) return;
    const next = [...outline];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };
  const remove = (id: string) => onChange(outline.filter((s) => s.id !== id));
  const addSection = () => {
    const newSection: ArticleOutlineSection = { id: `sec-${Date.now()}`, type: 'h2', heading: 'New Section', subpoints: [] };
    onChange([...outline, newSection]);
    setExpandedIds((prev) => new Set([...prev, newSection.id]));
  };

  return (
    <div className="space-y-2">
      {outline.map((section, idx) => {
        const isExpanded = expandedIds.has(section.id);
        return (
          <div key={section.id} className="rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button type="button" onClick={() => cycleType(section.id, section.type)} title="Click to change section type"
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition hover:opacity-75 ${SECTION_COLORS[section.type]}`}>
                {SECTION_LABELS[section.type]}
              </button>
              <input value={section.heading} onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                className="flex-1 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                placeholder="Section heading..." />
              <button type="button" onClick={() => toggleExpanded(section.id)} className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-blue-500">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => move(section.id, 'up')} disabled={idx === 0}
                className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-blue-500 disabled:opacity-30">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => move(section.id, 'down')} disabled={idx === outline.length - 1}
                className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-blue-500 disabled:opacity-30">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => remove(section.id)} className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {isExpanded && (
              <div className="border-t px-3 pb-3 pt-2.5" style={{ borderColor: 'var(--border)' }}>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Subpoints (one per line)</label>
                <textarea
                  value={section.subpoints.join('\n')}
                  onChange={(e) => updateSection(section.id, { subpoints: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                  rows={Math.max(2, section.subpoints.length + 1)}
                  placeholder="- Key point to cover&#10;- Another point"
                  className={`${inputCls} resize-y font-mono text-xs`}
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        );
      })}
      <button type="button" onClick={addSection}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-sm text-[var(--text-muted)] transition hover:border-blue-400 hover:text-blue-500"
        style={{ borderColor: 'var(--border)' }}>
        <Plus className="h-4 w-4" /> Add Section
      </button>
    </div>
  );
}

// ─── Loading pulse ────────────────────────────────────────────────────────────

function LoadingPulse({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      <span>{message}</span>
    </div>
  );
}

// ─── Direct Generate Panel (Phase 5 Human Content Engine) ─────────────────────

interface DirectGenResult {
  article: Article;
  calculatorMatch: { slug: string; name: string; score: number } | null;
  meta: {
    wordCount: number;
    readingTime: number;
    faqCount: number;
    hasHowTo: boolean;
    hasToc: boolean;
    schemaTypes: string[];
  };
}

function DirectGeneratePanel({ onArticleCreated }: { onArticleCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [keyword, setKeyword] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DirectGenResult | null>(null);

  // Auto-generate slug from title
  const STOP = new Set(['a','an','the','and','or','but','for','to','of','in','on','at','by','is','it','its','this','that','with','how','what','why','when','your','you','our','not','all','more','about','get','use','do','does','can','may','has','have']);
  function autoSlug(v: string) {
    return v.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP.has(w))
      .slice(0, 6)
      .join('-')
      .replace(/(^-|-$)/g, '');
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!slugEdited) setSlug(autoSlug(v));
  }

  async function handleGenerate() {
    setError('');
    setResult(null);
    if (!title.trim() || !keyword.trim() || !slug.trim()) {
      setError('All three fields are required.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/articles/generate-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), keyword: keyword.trim(), slug: slug.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setResult(data as DirectGenResult);
      onArticleCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  function handleReset() {
    setTitle(''); setKeyword(''); setSlug('');
    setSlugEdited(false); setError(''); setResult(null);
  }

  const inputCls =
    'w-full rounded-xl border bg-[var(--bg-input)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:ring-2 focus:ring-blue-500/40';
  const inputStyle = { borderColor: 'var(--border)' };

  if (result) {
    const { article, calculatorMatch, meta } = result;
    return (
      <div className="space-y-4">
        {/* Success banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--text-primary)]">Article generated</p>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              Saved as draft — {meta.wordCount.toLocaleString()} words · {meta.readingTime} min read · {meta.faqCount} FAQs
              {meta.hasHowTo && ' · How-To'}{meta.hasToc && ' · TOC'}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {meta.schemaTypes.map(s => (
                <span key={s} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-500">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Calculator match */}
        {calculatorMatch ? (
          <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
            <Calculator className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Calculator linked</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                One natural internal link to <strong>{calculatorMatch.name}</strong> was added, plus a Related Calculator section near the conclusion.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border px-5 py-4" style={{ borderColor: 'var(--border)' }}>
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-muted)]">No closely related calculator found — article generated without internal calculator links.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/admin/articles/${article.id}`}
            className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-600">
            View &amp; Edit Article
          </Link>
          <button type="button" onClick={handleReset}
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
            style={{ borderColor: 'var(--border)' }}>
            New Article
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Explanation */}
      <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
        Enter your title, focus keyword, and SEO slug. The engine writes a premium expert article, then automatically finds the most relevant calculator on the platform — adding one natural internal link and a Related Calculator section if the match is strong enough.
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Article Title</label>
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="e.g. How to Pay Off a Mortgage Early: 7 Proven Strategies"
            className={inputCls}
            style={inputStyle}
            disabled={generating}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Focus Keyword</label>
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="e.g. pay off mortgage early"
            className={inputCls}
            style={inputStyle}
            disabled={generating}
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">The primary keyword this article targets. Used naturally — never stuffed.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">SEO Slug</label>
          <div className="flex items-center gap-0">
            <span className="rounded-l-xl border border-r-0 bg-[var(--bg-input)] px-3 py-2.5 text-xs text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={e => { setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-')); setSlugEdited(true); }}
              placeholder="pay-off-mortgage-early"
              className="flex-1 rounded-l-none rounded-r-xl border bg-[var(--bg-input)] px-3.5 py-2.5 text-sm font-mono text-[var(--text-primary)] outline-none transition focus:ring-2 focus:ring-blue-500/40"
              style={{ borderColor: 'var(--border)' }}
              disabled={generating}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={generating || !title.trim() || !keyword.trim() || !slug.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating article — this takes about 60–90 seconds…
          </>
        ) : (
          <>
            <PenLine className="h-4 w-4" />
            Generate Article
          </>
        )}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArticlesPage() {
  // ── Workflow state ──────────────────────────────────────────────────────────
  const [opportunities, setOpportunities] = useState<{ title: string }[]>([]);
  const [selectedOpportunityIdx, setSelectedOpportunityIdx] = useState<number | null>(null);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const discoverAbortRef = useRef<AbortController | null>(null);

  const [research, setResearch] = useState<ArticleResearchSummary | null>(null);
  const [intentAnalysis, setIntentAnalysis] = useState('');

  // Keyword step
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [keywordLocked, setKeywordLocked] = useState(false);

  // Title step
  const [titleCards, setTitleCards] = useState<ResearchTitleCard[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');

  // Slug
  const [slug, setSlug] = useState('');

  // SEO Data + Outline
  const [seoData, setSeoData] = useState<ArticleAutoSeoData | null>(null);
  const [outline, setOutline] = useState<ArticleOutlineSection[]>([]);

  // Article
  const [article, setArticle] = useState<Article | null>(null);
  const [generationStage, setGenerationStage] = useState('');

  // UI state
  const [phase, setPhase] = useState<Phase>('idle');
  const [working, setWorking] = useState<Working>(null);
  const [notice, setNotice] = useState<{ kind: NoticeKind; text: string } | null>(null);

  // Saved articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // ── Active tab ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'workflow' | 'direct'>('direct');

  // ── Derived ─────────────────────────────────────────────────────────────────
  const hasKeyword = Boolean(selectedKeyword.trim() && keywordLocked);
  const hasTitle = Boolean(selectedTitle.trim());
  const hasSlug = Boolean(slug.trim());
  const hasOutline = outline.length > 0;
  // Generate is unlocked as soon as keyword + title + slug are ready.
  // Outline and SEO data are fetched automatically inside generateArticle().
  const canGenerate = hasKeyword && hasTitle && hasSlug && !article;

  const duplicateKeyword = Boolean(
    selectedKeyword.trim() &&
    articles.some((a) => (a.seoData.keywords ?? []).some((k) => k.toLowerCase() === selectedKeyword.trim().toLowerCase()))
  );

  // ── Load saved articles ─────────────────────────────────────────────────────
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

  // ── Discover opportunities ──────────────────────────────────────────────────
  const discoverOpportunities = useCallback(async () => {
    discoverAbortRef.current?.abort();
    const controller = new AbortController();
    discoverAbortRef.current = controller;
    setLoadingDiscovery(true);
    setOpportunities([]);
    try {
      const res = await fetch('/api/admin/articles/discover', { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!res.ok) return;
      const data = await res.json() as { opportunities?: { title: string }[] };
      if (!controller.signal.aborted) {
        setOpportunities(Array.isArray(data.opportunities) ? data.opportunities.slice(0, 3) : []);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    } finally {
      if (!controller.signal.aborted) setLoadingDiscovery(false);
    }
  }, []);

  // Auto-discover on mount; abort on unmount to suppress unhandled rejections
  useEffect(() => {
    void discoverOpportunities();
    return () => { discoverAbortRef.current?.abort(); };
  }, [discoverOpportunities]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const runResearch = async (researchTopic: string) => {
    const trimmed = researchTopic.trim();
    if (!trimmed) return;
    setWorking('research');
    setNotice(null);
    setPhase('researching');
    setResearch(null);
    setIntentAnalysis('');
    setSelectedKeyword('');
    setKeywordLocked(false);
    setTitleCards([]);
    setSelectedTitle('');
    setSlug('');
    setSeoData(null);
    setOutline([]);
    setArticle(null);
    try {
      const res = await fetch('/api/admin/articles/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Research failed.');
      setResearch(data.summary as ArticleResearchSummary);
      setIntentAnalysis(data.intentAnalysis ?? '');
      setPhase('selecting-keyword');
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Research failed. Please try again.' });
      setPhase('idle');
    } finally {
      setWorking(null);
    }
  };

  const selectKeyword = async (chip: ResearchKeywordChip) => {
    setSelectedKeyword(chip.keyword);
    setKeywordLocked(true);
    setTitleCards([]);
    setSelectedTitle('');
    setSlug('');
    setSeoData(null);
    setOutline([]);
    setArticle(null);
    setNotice(null);
    setPhase('loading-titles');
    setWorking('titles');
    try {
      const res = await fetch('/api/admin/articles/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: chip.keyword, researchSummary: research }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Title generation failed.');
      setTitleCards(Array.isArray(data.titleCards) ? data.titleCards : []);
      setPhase('selecting-title');
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Title generation failed. Please try again.' });
      setPhase('selecting-keyword');
      setKeywordLocked(false);
    } finally {
      setWorking(null);
    }
  };

  // Selecting a title is now instantaneous — outline + SEO data are
  // generated automatically when the admin clicks "Generate Article".
  const selectTitle = (card: ResearchTitleCard) => {
    setSelectedTitle(card.title);
    setSlug(slugify(card.title));
    setSeoData(null);
    setOutline([]);
    setArticle(null);
    setNotice(null);
    setPhase('editing-outline');
  };

  const improveSlug = async () => {
    if (!selectedTitle.trim()) return;
    setWorking('slug');
    setNotice(null);
    try {
      const res = await fetch('/api/admin/articles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'slug', title: selectedTitle.trim() }),
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
    setPhase('generating');
    setNotice(null);

    try {
      // ── Stage 1: Generate outline + SEO strategy (automatic, no admin action) ──
      let activeSeoData = seoData;
      let activeOutline = outline;

      if (!activeOutline.length || !activeSeoData) {
        setGenerationStage('Analysing keyword and building content strategy…');
        const outlineRes = await fetch('/api/admin/articles/outline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: selectedTitle.trim(),
            keyword: selectedKeyword.trim(),
            researchSummary: research,
          }),
        });
        const outlineData = await outlineRes.json() as {
          seoData?: ArticleAutoSeoData;
          outline?: ArticleOutlineSection[];
          error?: string;
        };
        if (!outlineRes.ok) throw new Error(outlineData.error ?? 'Content strategy generation failed.');
        activeSeoData = outlineData.seoData ?? null;
        activeOutline = Array.isArray(outlineData.outline) ? outlineData.outline : [];
        setSeoData(activeSeoData);
        setOutline(activeOutline);
      }

      // ── Stage 2: Write the article ─────────────────────────────────────────
      setGenerationStage('Writing article — introduction, sections, FAQ, schema…');

      const outlineForGenerate = activeOutline.map((s) => ({
        heading: s.heading,
        level: s.type === 'h3' ? 'h3' : 'h2',
        subpoints: s.subpoints,
      }));

      const genRes = await fetch('/api/admin/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: selectedKeyword.trim(),
          primaryKeyword: activeSeoData?.focusKeyword ?? selectedKeyword.trim(),
          secondaryKeywords: activeSeoData?.secondaryKeywords ?? research?.relatedSearches?.slice(0, 5) ?? [],
          selectedTitle: selectedTitle.trim(),
          intentAnalysis: activeSeoData?.userIntent ?? intentAnalysis,
          outline: outlineForGenerate,
          metaTitle: selectedTitle.trim(),
          metaDescription: '',
          urlSlug: slug.trim(),
          lockedKeywords: [selectedKeyword.trim(), ...(activeSeoData?.secondaryKeywords?.slice(0, 3) ?? [])],
        }),
      });
      const genData = await genRes.json() as { article?: Article; error?: string };
      if (!genRes.ok) throw new Error(genData.error ?? 'Article generation failed.');

      // ── Stage 3: Persist + refresh ─────────────────────────────────────────
      setGenerationStage('Saving draft to database…');
      setArticle(genData.article as Article);
      setPhase('done');
      await loadArticles();
      setNotice({ kind: 'success', text: 'Article saved as draft. Review and edit before publishing.' });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Article generation failed.' });
      setPhase('editing-outline');
    } finally {
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
    const nextStatus: Article['status'] = action === 'publish' ? 'published' : action === 'review' ? 'pending_review' : 'draft';
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTitle,
          slug,
          content: article.content,
          status: nextStatus,
          seoData: {
            ...article.seoData,
            title: selectedTitle,
            keywords: [selectedKeyword.trim(), ...(seoData?.secondaryKeywords?.slice(0, 4) ?? [])],
            canonicalUrl: `/blog/${slug}`,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unable to save article.');
      setArticle(data.article);
      await loadArticles();
      const msg = action === 'publish' ? 'Article published.' : action === 'review' ? 'Article sent to review.' : 'Draft saved.';
      setNotice({ kind: 'success', text: msg });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Unable to save article.' });
    } finally {
      setWorking(null);
    }
  };

  const selectOpportunity = (idx: number, title: string) => {
    setSelectedOpportunityIdx(idx);
    void runResearch(title);
  };

  const reset = () => {
    discoverAbortRef.current?.abort();
    setSelectedOpportunityIdx(null);
    setResearch(null);
    setIntentAnalysis('');
    setSelectedKeyword('');
    setKeywordLocked(false);
    setTitleCards([]);
    setSelectedTitle('');
    setSlug('');
    setSeoData(null);
    setOutline([]);
    setArticle(null);
    setPhase('idle');
    setWorking(null);
    setGenerationStage('');
    setNotice(null);
    void discoverOpportunities();
  };

  // ── Phase helpers ────────────────────────────────────────────────────────────
  // Title selection now goes directly to 'editing-outline' (no loading-content step)
  const isAfterTitle = ['editing-outline', 'generating', 'done'].includes(phase);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">

      {/* Header */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-500">Phase 5 · Content Studio</p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Human Content Engine</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Premium expert articles — Google Helpful Content first.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border p-1 text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('direct')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition ${activeTab === 'direct' ? 'bg-blue-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
        >
          <PenLine className="h-4 w-4" /> Direct Generate
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('workflow')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition ${activeTab === 'workflow' ? 'bg-blue-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
        >
          <Brain className="h-4 w-4" /> Smart Workflow
        </button>
      </div>

      {/* Global notice (workflow mode only) */}
      {activeTab === 'workflow' && notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      {/* ──────────────────────────────────────────────────────────────────────
          DIRECT GENERATE MODE
      ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'direct' && (
        <section className="rounded-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white">
              <PenLine className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Direct Article Generator</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Enter a title, keyword, and slug. The Phase 5 engine writes a 1,800–2,400 word expert article with natural tone, real data, and smart calculator linking.
              </p>
            </div>
          </div>
          <div className="p-5">
            <DirectGeneratePanel onArticleCreated={loadArticles} />
          </div>
        </section>
      )}

      {/* Only show workflow steps when in workflow mode */}
      {activeTab === 'workflow' && (<>

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 1 — AI Article Discovery
      ────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border" style={{ borderColor: phase === 'idle' || phase === 'researching' ? 'var(--blue-500, #3b82f6)' : 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${phase === 'idle' || phase === 'researching' ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-500'}`}>1</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">AI Article Discovery</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              AI automatically discovers the 3 strongest article opportunities using Google Search, Autocomplete, Trends, People Also Ask, Reddit, Quora and OpenRouter analysis.
            </p>
          </div>
          {phase === 'researching' && <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-blue-500" />}
          {research && phase !== 'idle' && phase !== 'researching' && <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />}
        </div>
        <div className="p-5 space-y-4">

          {/* Discovery loading */}
          {loadingDiscovery && phase === 'idle' && (
            <LoadingPulse message="Analysing Google Autocomplete, Trends, PAA, Reddit, Quora — discovering best opportunities…" />
          )}

          {/* Opportunity cards — shown when idle and not yet locked */}
          {!loadingDiscovery && opportunities.length > 0 && phase === 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Select an opportunity to begin — the workflow continues automatically
                </p>
                <button
                  type="button"
                  onClick={() => { if (!loadingDiscovery) void discoverOpportunities(); }}
                  disabled={loadingDiscovery}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <RefreshCw className="h-3 w-3" /> Refresh Suggestions
                </button>
              </div>
              <div className="space-y-2">
                {opportunities.map((opp, i) => (
                  <OpportunityCard
                    key={i}
                    title={opp.title}
                    selected={selectedOpportunityIdx === i}
                    locked={selectedOpportunityIdx !== null && selectedOpportunityIdx !== i}
                    onClick={() => { if (working === null && selectedOpportunityIdx === null) selectOpportunity(i, opp.title); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Locked selection shown after workflow starts */}
          {selectedOpportunityIdx !== null && opportunities[selectedOpportunityIdx] && phase !== 'idle' && (
            <div className="rounded-2xl border border-blue-500 bg-blue-500/8 px-5 py-4 shadow-md shadow-blue-500/10">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold leading-snug text-blue-600 dark:text-blue-400">
                  {opportunities[selectedOpportunityIdx].title}
                </p>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                  <Lock className="h-3 w-3" /> Selected
                </span>
              </div>
            </div>
          )}

          {/* Research in progress */}
          {phase === 'researching' && (
            <LoadingPulse message="Searching Google, collecting PAA questions, analysing trends, running AI analysis…" />
          )}

          {/* Research summary */}
          {research && phase !== 'researching' && <ResearchSummary research={research} />}

          {/* Intent analysis */}
          {intentAnalysis && phase !== 'researching' && (
            <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-500">AI Intent Analysis</p>
              <p className="text-sm text-[var(--text-secondary)]">{intentAnalysis}</p>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 2 — Focus Keywords
      ────────────────────────────────────────────────────────────────────── */}
      <StepCard
        number="2"
        title="Focus Keywords"
        description="5 strongest focus keywords ranked by search volume, competition, opportunity score, and long-tail relevance. Select one to continue automatically."
        locked={!research || phase === 'researching'}
        active={phase === 'selecting-keyword'}
      >
        {/* Loading titles */}
        {phase === 'loading-titles' && (
          <LoadingPulse message="Focus keyword locked — generating optimised title suggestions…" />
        )}

        {/* Keyword chips */}
        {research && research.keywordChips.length > 0 && phase !== 'researching' && (
          <div className="space-y-3">
            {!research.serpDataAvailable && (
              <p className="text-xs text-amber-600">
                Live metrics unavailable — configure a SerpAPI key in Settings for real search volume data.
              </p>
            )}

            {/* Chips — locked once selection made */}
            {!keywordLocked && (
              <div className="space-y-2">
                {research.keywordChips.map((chip, i) => (
                  <KeywordChipCard
                    key={i}
                    chip={chip}
                    selected={selectedKeyword === chip.keyword}
                    locked={false}
                    onClick={() => {
                      if (working !== null || keywordLocked) return;
                      void selectKeyword(chip);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Locked Focus Keyword display */}
            {selectedKeyword && keywordLocked && (
              <div className="rounded-xl border border-blue-500 bg-blue-500/8 px-5 py-4 shadow-md shadow-blue-500/10">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-500">Focus Keyword</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{selectedKeyword}</p>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                    <Lock className="h-3 w-3" /> Locked
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </StepCard>

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 3 — Title Suggestions
      ────────────────────────────────────────────────────────────────────── */}
      <StepCard
        number="3"
        title="Title Suggestions"
        description="5 SEO-optimised titles based on your selected keyword. Select one to auto-fill the title and slug."
        locked={!hasKeyword || phase === 'loading-titles' || phase === 'selecting-keyword'}
        active={phase === 'selecting-title'}
      >
        {/* Title cards */}
        {titleCards.length > 0 && !['loading-titles', 'researching', 'selecting-keyword'].includes(phase) && (
          <div className="space-y-3">
            <div className="space-y-2">
              {titleCards.map((card, i) => (
                <TitleCardItem
                  key={i}
                  card={card}
                  selected={selectedTitle === card.title}
                  onClick={() => {
                    if (working !== null) return;
                    selectTitle(card);
                  }}
                />
              ))}
            </div>

            {/* Selected title + slug */}
            {selectedTitle && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Selected title</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedTitle}</p>
                  </div>
                </div>
                {/* Slug */}
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">
                      SEO URL Slug <span className="font-normal text-[var(--text-muted)] opacity-70">— auto-generated, editable</span>
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono opacity-60">/blog/{slug || '…'}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+/, ''))}
                      placeholder="keyword-focused-slug"
                      className={`${inputCls} font-mono flex-1`}
                      style={inputStyle}
                    />
                    <GhostButton onClick={() => void improveSlug()} disabled={working !== null || !hasTitle} loading={working === 'slug'}>
                      {working !== 'slug' && <Wand2 className="h-4 w-4" />}
                      AI Slug
                    </GhostButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {titleCards.length === 0 && hasKeyword && !['loading-titles', 'selecting-keyword'].includes(phase) && (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">Select a keyword above to generate title suggestions.</p>
        )}
      </StepCard>

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 4 — SEO Data
      ────────────────────────────────────────────────────────────────────── */}
      <StepCard
        number="4"
        title="SEO Data"
        description="Auto-generated when you click Generate Article — focus keyword, secondary keywords, user intent, audience and content angle."
        locked={!isAfterTitle}
        active={phase === 'generating' && !seoData}
      >
        {phase === 'generating' && !seoData ? (
          <LoadingPulse message="Building keyword strategy from research signals…" />
        ) : seoData ? (
          <SeoDataPanel seoData={seoData} />
        ) : isAfterTitle ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
            <Zap className="h-4 w-4 shrink-0 text-blue-400" />
            Generated automatically when you click <strong className="text-[var(--text-secondary)]">Generate Article</strong>.
          </div>
        ) : null}
      </StepCard>

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 5 — Content Outline
      ────────────────────────────────────────────────────────────────────── */}
      <StepCard
        number="5"
        title="Content Outline"
        description="Auto-generated when you click Generate Article — H2/H3 sections, FAQ, How-To, Comparison, Pros & Cons and more."
        locked={!isAfterTitle}
        active={phase === 'generating' && !hasOutline}
      >
        {phase === 'generating' && !hasOutline ? (
          <LoadingPulse message="Building content outline from PAA questions and research signals…" />
        ) : outline.length > 0 ? (
          <OutlineEditor outline={outline} onChange={setOutline} />
        ) : isAfterTitle ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
            <Zap className="h-4 w-4 shrink-0 text-blue-400" />
            Generated automatically when you click <strong className="text-[var(--text-secondary)]">Generate Article</strong>.
          </div>
        ) : null}
      </StepCard>

      {/* ──────────────────────────────────────────────────────────────────────
          STEP 6 — Generate Article
      ────────────────────────────────────────────────────────────────────── */}
      <StepCard
        number="6"
        title="Generate Article"
        description="Generates a complete, human-first SEO article following the outline. Edit before publishing."
        locked={!canGenerate && !article}
        active={phase === 'generating'}
      >
        {!article ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed p-5 text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                <FileText className="h-4 w-4 text-blue-500" /> What gets generated
              </div>
              <p>
                Key Takeaways · Hook · Introduction · Reading Time · Table of Contents ·
                H2/H3 sections · Step-by-Step Guide · Examples · FAQ · Pros & Cons ·
                Common Mistakes · Tips · Best Practices · Related Calculators · Summary ·
                Conclusion · CTA · References · Meta Title · Meta Description ·
                OpenGraph · Twitter Cards · JSON-LD · Article Schema · FAQ Schema
              </p>
            </div>

            {generationStage && <Notice kind="info">{generationStage}</Notice>}

            {duplicateKeyword && (
              <Notice kind="error">Duplicate keyword — choose a different focus keyword before generating.</Notice>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void generateArticle()}
                disabled={working !== null || !canGenerate || duplicateKeyword}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {working === 'generate' ? 'Generating article…' : 'Generate Article'}
              </button>
              {!canGenerate && (
                <p className="text-xs text-[var(--text-muted)]">
                  {!hasKeyword ? 'Select a focus keyword to unlock.' : !hasTitle ? 'Select a title to unlock.' : !hasSlug ? 'A URL slug is required.' : ''}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Article metadata */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(article.status)}`}>
                {statusLabel(article.status)}
              </span>
              {article.wordCount && <span className="text-xs text-[var(--text-muted)]">{article.wordCount.toLocaleString()} words</span>}
              {article.readingTime && <span className="text-xs text-[var(--text-muted)]">{article.readingTime} min read</span>}
              <span className="ml-auto text-xs text-[var(--text-muted)]">HTML — editable</span>
            </div>

            {/* Article HTML editor */}
            <textarea
              value={article.content}
              onChange={(e) => setArticle({ ...article, content: e.target.value })}
              rows={28}
              className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
              style={inputStyle}
              aria-label="Article content"
            />

            {/* SEO output preview */}
            {(article.seoData.title || article.seoData.description) && (
              <div className="rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <div className="border-b px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    <Globe className="h-3.5 w-3.5 text-blue-500" /> SEO Output
                  </p>
                </div>
                <div className="space-y-3 p-4 text-xs">
                  <div>
                    <span className="font-semibold text-[var(--text-muted)]">Meta Title: </span>
                    <span className="text-[var(--text-primary)]">{article.seoData.title}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--text-muted)]">Meta Description: </span>
                    <span className="text-[var(--text-primary)]">{article.seoData.description}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[var(--text-muted)]">Canonical: </span>
                    <span className="font-mono text-[var(--text-primary)]">{article.seoData.canonicalUrl}</span>
                  </div>
                  {article.schemaFaq && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> FAQ Schema (FAQPage) generated
                    </div>
                  )}
                  {article.schemaArticle && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> Article Schema generated
                    </div>
                  )}
                  {article.schemaHowTo && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> HowTo Schema generated
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/articles/${article.id}`}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
                style={{ borderColor: 'var(--border)' }}
              >
                <FileText className="h-4 w-4" /> Open in Editor
              </Link>
              <a
                href={`/blog/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-emerald-500 hover:text-emerald-500"
                style={{ borderColor: 'var(--border)' }}
              >
                <Globe className="h-4 w-4" /> Preview
              </a>
              {article.status === 'draft' && (
                <button
                  type="button"
                  onClick={() => void saveWorkflow('review')}
                  disabled={working !== null}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 px-4 py-2.5 text-sm font-semibold text-amber-500 transition hover:bg-amber-500/10 disabled:opacity-50"
                >
                  {working === 'review' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {working === 'review' ? 'Sending…' : 'Send to Review'}
                </button>
              )}
              {article.status === 'pending_review' && (
                <button
                  type="button"
                  onClick={() => void saveWorkflow('publish')}
                  disabled={working !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {working === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {working === 'publish' ? 'Publishing…' : 'Publish'}
                </button>
              )}
            </div>
          </div>
        )}
      </StepCard>
      </>)}

      {/* ──────────────────────────────────────────────────────────────────────
          Saved Articles
      ────────────────────────────────────────────────────────────────────── */}
      {(articles.length > 0 || loadingArticles) && (
        <section className="rounded-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Saved Articles {articles.length > 0 && <span className="ml-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-500">{articles.length}</span>}
            </h2>
            <button type="button" onClick={() => void loadArticles()} disabled={loadingArticles}
              className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:text-blue-500 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loadingArticles ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {loadingArticles ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              articles.map((art) => (
                <div key={art.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-card-hover)] transition">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/articles/${art.id}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-blue-500 transition line-clamp-1">
                      {art.title}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span className="font-mono">/blog/{art.slug}</span>
                      {art.wordCount && <span>{art.wordCount.toLocaleString()} words</span>}
                      {art.readingTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{art.readingTime} min</span>}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(art.status)}`}>
                    {statusLabel(art.status)}
                  </span>
                  <Link href={`/admin/articles/${art.id}`}
                    className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] transition hover:text-blue-500">
                    <FileText className="h-4 w-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
