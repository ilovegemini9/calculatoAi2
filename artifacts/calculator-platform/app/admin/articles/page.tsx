'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  Info,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wand2,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  Article,
  ArticleOutlineSection,
  ArticleResearchSummary,
  ResearchKeywordChip,
  ResearchTitleCard,
  TopicSuggestion,
} from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'researching'
  | 'titles'
  | 'loading-keywords'
  | 'selecting-keyword'
  | 'loading-outline'
  | 'editing-outline'
  | 'generating'
  | 'done';

type WorkflowAction = 'draft' | 'review' | 'publish';
type Working = 'research' | 'keywords' | 'slug' | 'outline' | 'generate' | WorkflowAction | null;
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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
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

function StepCard({ number, title, description, locked, children }: {
  number: string; title: string; description: string; locked?: boolean; children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border transition-opacity ${locked ? 'opacity-50 pointer-events-none select-none' : ''}`}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
    >
      <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-500">{number}</span>
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

function PrimaryButton({ onClick, disabled, loading, children }: {
  onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading}
      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
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

function MetricBadge({ label, value, icon: Icon }: { label: string; value: string | null; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
      {Icon && <Icon className="h-3 w-3" />}
      <span className="font-medium text-[var(--text-secondary)]">{label}:</span>
      {value}
    </span>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 70 ? 'bg-emerald-500/10 text-emerald-600' : score >= 45 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      <Zap className="h-3 w-3" /> {score}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string | null }) {
  if (!trend) return null;
  if (trend === 'Rising') return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trend === 'Declining') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <BarChart2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />;
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
      className={`group w-full rounded-2xl border text-left transition ${
        selected
          ? 'border-blue-500 bg-blue-500/5 shadow-sm shadow-blue-500/10'
          : 'hover:border-blue-400/60 hover:bg-blue-500/3'
      }`}
      style={{ borderColor: selected ? undefined : 'var(--border)' }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">{card.title}</p>
          <div className="flex shrink-0 items-center gap-2">
            {selected && (
              <span className="flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                <Check className="h-3 w-3" /> Selected
              </span>
            )}
            {!selected && (
              <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
            )}
          </div>
        </div>

        {hasMetrics ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <MetricBadge label="Vol" value={card.searchVolumeLabel} icon={Search} />
            <MetricBadge label="Competition" value={card.competition} />
            {card.trend && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <TrendIcon trend={card.trend} />
                <span>{card.trend}</span>
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

// ─── Keyword Chip ─────────────────────────────────────────────────────────────

function KeywordChipItem({ chip, selected, onClick }: {
  chip: ResearchKeywordChip; selected: boolean; onClick: () => void;
}) {
  const hasMetrics = chip.searchVolumeLabel || chip.competition || chip.trend;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border p-3 text-left transition ${
        selected
          ? 'border-blue-500 bg-blue-500/5'
          : 'hover:border-blue-400/60 hover:bg-blue-500/3'
      }`}
      style={{ borderColor: selected ? undefined : 'var(--border)' }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected ? 'bg-blue-500' : 'bg-blue-500/40'}`} />
        <span className="text-sm font-semibold text-[var(--text-primary)]">{chip.keyword}</span>
        {selected && <Check className="ml-auto h-3.5 w-3.5 text-blue-500" />}
      </div>
      {hasMetrics ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {chip.searchVolumeLabel && <span className="text-xs text-[var(--text-muted)]">{chip.searchVolumeLabel}</span>}
          {chip.competition && <span className="text-xs text-[var(--text-muted)]">{chip.competition} comp.</span>}
          {chip.trend && (
            <span className="inline-flex items-center gap-0.5 text-xs text-[var(--text-muted)]">
              <TrendIcon trend={chip.trend} />{chip.trend}
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)] italic">Live data unavailable</p>
      )}
    </button>
  );
}

// ─── Topic Suggestion Card ────────────────────────────────────────────────────

function TopicSuggestionCard({ suggestion, selected, onClick }: {
  suggestion: TopicSuggestion; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border text-left transition ${
        selected
          ? 'border-blue-500 bg-blue-500/5 shadow-sm shadow-blue-500/10'
          : 'hover:border-blue-400/60 hover:bg-blue-500/3'
      }`}
      style={{ borderColor: selected ? undefined : 'var(--border)' }}
    >
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{suggestion.topic}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {suggestion.searchVolumeLabel && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Search className="h-3 w-3" />
                {suggestion.searchVolumeLabel}
              </span>
            )}
            {suggestion.competition && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                suggestion.competition === 'Low'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : suggestion.competition === 'Medium'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-red-500/10 text-red-600'
              }`}>
                {suggestion.competition}
              </span>
            )}
            {suggestion.trend && (
              <span className="inline-flex items-center gap-0.5 text-xs text-[var(--text-muted)]">
                {suggestion.trend === 'Rising'
                  ? <span className="font-bold text-emerald-500">↑</span>
                  : suggestion.trend === 'Declining'
                  ? <span className="font-bold text-red-500">↓</span>
                  : <span className="text-[var(--text-muted)]">→</span>}
                <span className="ml-0.5">{suggestion.trend}</span>
              </span>
            )}
            {suggestion.opportunityScore !== null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                suggestion.opportunityScore >= 70
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : suggestion.opportunityScore >= 45
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-red-500/10 text-red-600'
              }`}>
                <Zap className="h-2.5 w-2.5" />
                {suggestion.opportunityScore}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {selected ? (
            <span className="flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-semibold text-white">
              <Check className="h-3 w-3" /> Selected
            </span>
          ) : (
            <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Research Summary ─────────────────────────────────────────────────────────

function ResearchSummary({ research }: { research: ArticleResearchSummary }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-4 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="font-semibold text-[var(--text-primary)]">Research Complete</span>
          {research.serpDataAvailable
            ? <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">Live SerpAPI data</span>
            : <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">Free sources only</span>
          }
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
              {
                label: 'Trend',
                value: research.trendDirection
                  ? `${research.trendDirection.charAt(0).toUpperCase() + research.trendDirection.slice(1)} (${research.trendInterest ?? '?'}/100)`
                  : 'Unavailable',
              },
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

// ─── Outline Editor ───────────────────────────────────────────────────────────

function OutlineEditor({
  outline,
  onChange,
}: {
  outline: ArticleOutlineSection[];
  onChange: (updated: ArticleOutlineSection[]) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateSection = (id: string, patch: Partial<ArticleOutlineSection>) => {
    onChange(outline.map((s) => s.id === id ? { ...s, ...patch } : s));
  };

  const cycleType = (id: string, currentType: ArticleOutlineSection['type']) => {
    const idx = SECTION_TYPES.indexOf(currentType);
    const next = SECTION_TYPES[(idx + 1) % SECTION_TYPES.length];
    updateSection(id, { type: next });
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
    const newSection: ArticleOutlineSection = {
      id: `sec-${Date.now()}`,
      type: 'h2',
      heading: 'New Section',
      subpoints: [],
    };
    onChange([...outline, newSection]);
    setExpandedIds((prev) => new Set([...prev, newSection.id]));
  };

  return (
    <div className="space-y-2">
      {outline.map((section, idx) => {
        const isExpanded = expandedIds.has(section.id);
        return (
          <div
            key={section.id}
            className="rounded-xl border"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() => cycleType(section.id, section.type)}
                title="Click to change section type"
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition hover:opacity-75 ${SECTION_COLORS[section.type]}`}
              >
                {SECTION_LABELS[section.type]}
              </button>

              <input
                value={section.heading}
                onChange={(e) => updateSection(section.id, { heading: e.target.value })}
                className="flex-1 bg-transparent text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                placeholder="Section heading..."
              />

              <button
                type="button"
                onClick={() => toggleExpanded(section.id)}
                className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-blue-500"
                title="Edit subpoints"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => move(section.id, 'up')}
                disabled={idx === 0}
                className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-blue-500 disabled:opacity-30"
                title="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(section.id, 'down')}
                disabled={idx === outline.length - 1}
                className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-blue-500 disabled:opacity-30"
                title="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(section.id)}
                className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-red-500"
                title="Remove section"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {isExpanded && (
              <div className="border-t px-3 pb-3 pt-2.5" style={{ borderColor: 'var(--border)' }}>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
                  Subpoints (one per line)
                </label>
                <textarea
                  value={section.subpoints.join('\n')}
                  onChange={(e) => updateSection(section.id, {
                    subpoints: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                  })}
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

      <button
        type="button"
        onClick={addSection}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-sm text-[var(--text-muted)] transition hover:border-blue-400 hover:text-blue-500"
        style={{ borderColor: 'var(--border)' }}
      >
        <Plus className="h-4 w-4" /> Add Section
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArticlesPage() {
  // ── Composer state ─────────────────────────────────────────────────────────
  const [topic, setTopic] = useState('');
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [selectedTopicIdx, setSelectedTopicIdx] = useState<number | null>(null);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const topicAbortRef = useRef<AbortController | null>(null);

  const [research, setResearch] = useState<ArticleResearchSummary | null>(null);
  const [intentAnalysis, setIntentAnalysis] = useState('');

  const [selectedTitle, setSelectedTitle] = useState('');
  const [keywordChips, setKeywordChips] = useState<ResearchKeywordChip[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [keywordLocked, setKeywordLocked] = useState(false);
  const [serpDataAvailable, setSerpDataAvailable] = useState(false);

  const [slug, setSlug] = useState('');
  const [outline, setOutline] = useState<ArticleOutlineSection[]>([]);
  const [article, setArticle] = useState<Article | null>(null);

  const [phase, setPhase] = useState<Phase>('idle');
  const [working, setWorking] = useState<Working>(null);
  const [generationStage, setGenerationStage] = useState('');
  const [notice, setNotice] = useState<{ kind: NoticeKind; text: string } | null>(null);

  // ── Saved articles ─────────────────────────────────────────────────────────
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasTitle = selectedTitle.trim().length > 0;
  const hasKeyword = selectedKeyword.trim().length > 0 && keywordLocked;
  const hasSlug = slug.trim().length > 0;
  const hasOutline = outline.length > 0;
  const canGenerate = hasTitle && hasKeyword && hasSlug && hasOutline && !article;

  const duplicateKeyword = useMemo(() =>
    Boolean(selectedKeyword.trim() && articles.some((a) =>
      (a.seoData.keywords ?? []).some((k) => k.toLowerCase() === selectedKeyword.trim().toLowerCase())
    )),
    [articles, selectedKeyword],
  );

  // ── Load saved articles ────────────────────────────────────────────────────
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

  // ── Debounced topic suggestions ────────────────────────────────────────────
  useEffect(() => {
    const trimmed = topic.trim();
    if (trimmed.length < 3 || phase !== 'idle') {
      setTopicSuggestions([]);
      setSelectedTopicIdx(null);
      return;
    }
    const timer = setTimeout(async () => {
      topicAbortRef.current?.abort();
      const controller = new AbortController();
      topicAbortRef.current = controller;
      setLoadingTopics(true);
      try {
        const res = await fetch('/api/admin/articles/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setTopicSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      } finally {
        setLoadingTopics(false);
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [topic, phase]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const runResearch = async (topicOverride?: string) => {
    const researchTopic = (topicOverride ?? topic).trim();
    if (!researchTopic) { setNotice({ kind: 'info', text: 'Enter a topic first.' }); return; }
    setWorking('research');
    setNotice(null);
    setPhase('researching');
    setResearch(null);
    setSelectedTitle('');
    setKeywordChips([]);
    setSelectedKeyword('');
    setKeywordLocked(false);
    setSlug('');
    setOutline([]);
    setArticle(null);
    try {
      const res = await fetch('/api/admin/articles/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: researchTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Research failed.');
      setResearch(data.summary as ArticleResearchSummary);
      setIntentAnalysis(data.intentAnalysis ?? '');
      setPhase('titles');
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Research failed. Please try again.' });
      setPhase('idle');
    } finally {
      setWorking(null);
    }
  };

  const selectTitle = async (card: ResearchTitleCard) => {
    setSelectedTitle(card.title);
    setSlug(slugify(card.title));
    setKeywordChips([]);
    setSelectedKeyword('');
    setKeywordLocked(false);
    setOutline([]);
    setArticle(null);
    setNotice(null);
    setPhase('loading-keywords');
    setWorking('keywords');
    try {
      const res = await fetch('/api/admin/articles/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'keywords', title: card.title, researchSummary: research }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ kind: 'info', text: 'Live keyword data unavailable.' });
        setPhase('titles');
        return;
      }
      setKeywordChips(Array.isArray(data.keywordChips) ? data.keywordChips : []);
      setSerpDataAvailable(Boolean(data.serpDataAvailable));
      setPhase('selecting-keyword');
    } catch {
      setNotice({ kind: 'info', text: 'Live keyword data unavailable.' });
      setPhase('titles');
    } finally {
      setWorking(null);
    }
  };

  const selectKeyword = async (chip: ResearchKeywordChip) => {
    setSelectedKeyword(chip.keyword);
    setKeywordLocked(true);
    setNotice(null);
    setOutline([]);
    setArticle(null);
    setPhase('loading-outline');
    setWorking('outline');
    try {
      const res = await fetch('/api/admin/articles/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selectedTitle, keyword: chip.keyword, researchSummary: research }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Outline generation failed.');
      setOutline(Array.isArray(data.outline) ? data.outline : []);
      setPhase('editing-outline');
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Outline generation failed.' });
      setPhase('selecting-keyword');
    } finally {
      setWorking(null);
    }
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

    const stages = [
      'Preparing article brief…',
      'Writing introduction and key takeaways…',
      'Building main sections, examples and comparisons…',
      'Adding FAQ, How-To, internal links and schema…',
      'Saving draft…',
    ];
    let idx = 0;
    setGenerationStage(stages[0]);
    const timer = window.setInterval(() => {
      idx = Math.min(idx + 1, stages.length - 1);
      setGenerationStage(stages[idx]);
    }, 12000);

    try {
      // Map outline sections to the generate endpoint format
      const outlineForGenerate = outline.map((s) => ({
        heading: s.heading,
        level: s.type === 'h3' ? 'h3' : 'h2',
        subpoints: s.subpoints,
      }));

      const res = await fetch('/api/admin/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: selectedKeyword.trim(),
          primaryKeyword: selectedKeyword.trim(),
          secondaryKeywords: research?.relatedSearches?.slice(0, 5) ?? [],
          selectedTitle: selectedTitle.trim(),
          intentAnalysis,
          outline: outlineForGenerate,
          metaTitle: selectedTitle.trim(),
          metaDescription: '',
          urlSlug: slug.trim(),
          lockedKeywords: [selectedKeyword.trim()],
          ...(research?.titleCards?.find((c) => c.title === selectedTitle) && {
            opportunityScore: research.titleCards.find((c) => c.title === selectedTitle)?.opportunityScore,
            searchVolume: research.titleCards.find((c) => c.title === selectedTitle)?.searchVolumeLabel,
            competition: research.titleCards.find((c) => c.title === selectedTitle)?.competition,
            trend: research.titleCards.find((c) => c.title === selectedTitle)?.trend,
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Article generation failed.');
      setArticle(data.article);
      setPhase('done');
      await loadArticles();
      setNotice({ kind: 'success', text: 'Article saved as draft. Review and edit before publishing.' });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Article generation failed.' });
      setPhase('editing-outline');
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
          title: selectedTitle,
          slug,
          content: article.content,
          status: nextStatus,
          seoData: {
            ...article.seoData,
            title: selectedTitle,
            keywords: [selectedKeyword.trim()],
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

  const selectTopicSuggestion = (idx: number, suggestion: TopicSuggestion) => {
    topicAbortRef.current?.abort();
    setTopic(suggestion.topic);
    setSelectedTopicIdx(idx);
    setLoadingTopics(false);
    void runResearch(suggestion.topic);
  };

  const reset = () => {
    topicAbortRef.current?.abort();
    setTopic('');
    setTopicSuggestions([]);
    setSelectedTopicIdx(null);
    setLoadingTopics(false);
    setResearch(null);
    setIntentAnalysis('');
    setSelectedTitle('');
    setKeywordChips([]);
    setSelectedKeyword('');
    setKeywordLocked(false);
    setSerpDataAvailable(false);
    setSlug('');
    setOutline([]);
    setArticle(null);
    setPhase('idle');
    setWorking(null);
    setGenerationStage('');
    setNotice(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const keywordsLocked = !hasTitle;
  const slugLocked = !hasTitle;
  const outlineLocked = !hasKeyword;
  const generateLocked = !hasTitle || !hasKeyword || !hasSlug || !hasOutline;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-500">Content Studio</p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">AI Articles Manager 2.0</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Research → AI analysis → SEO title → Keyword → Outline → Article
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
          style={{ borderColor: 'var(--border)' }}
        >
          <X className="h-4 w-4" /> New article
        </button>
      </div>

      {/* Global notice */}
      {notice && <Notice kind={notice.kind}>{notice.text}</Notice>}

      {/* ── Step 1 — Live Research + Titles ── */}
      <section className="rounded-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-500">1</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Live Research + Article Title</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Enter a topic. The system researches Google, PAA, trends, Reddit — then AI generates 5 title opportunities.
            </p>
          </div>
          {phase === 'researching' && <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-blue-500" />}
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">Research Topic</label>
              <div className="relative">
                <input
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setSelectedTopicIdx(null);
                    if (phase !== 'idle') reset();
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !working) void runResearch(); }}
                  placeholder="Start typing a topic — suggestions appear automatically…"
                  className={inputCls}
                  style={inputStyle}
                  disabled={phase === 'researching'}
                />
                {loadingTopics && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-400" />
                )}
              </div>
            </div>
            <PrimaryButton
              onClick={() => void runResearch()}
              disabled={working !== null || !topic.trim()}
              loading={working === 'research'}
            >
              {working !== 'research' && <Search className="h-4 w-4" />}
              {working === 'research' ? 'Researching…' : 'Run Research'}
            </PrimaryButton>
          </div>

          {/* Topic suggestion cards */}
          {phase === 'idle' && topicSuggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                5 Topic Opportunities — click one to start the full workflow automatically
              </p>
              <div className="space-y-2">
                {topicSuggestions.map((suggestion, i) => (
                  <TopicSuggestionCard
                    key={i}
                    suggestion={suggestion}
                    selected={selectedTopicIdx === i}
                    onClick={() => { if (working === null) selectTopicSuggestion(i, suggestion); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Research loading stages */}
          {phase === 'researching' && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>Searching Google, collecting PAA, analyzing trends, running AI analysis…</span>
            </div>
          )}

          {/* Research summary */}
          {research && phase !== 'researching' && (
            <ResearchSummary research={research} />
          )}

          {/* Intent analysis */}
          {intentAnalysis && phase !== 'researching' && (
            <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-500">AI Intent Analysis</p>
              <p className="text-sm text-[var(--text-secondary)]">{intentAnalysis}</p>
            </div>
          )}

          {/* Title cards */}
          {research && research.titleCards.length > 0 && phase !== 'researching' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  5 AI-Generated Title Opportunities
                  {!research.serpDataAvailable && (
                    <span className="ml-2 font-normal not-italic text-amber-600">— live metrics unavailable (add SerpAPI key in Settings)</span>
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {research.titleCards.map((card, i) => (
                  <TitleCardItem
                    key={i}
                    card={card}
                    selected={selectedTitle === card.title}
                    onClick={() => { if (working === null) void selectTitle(card); }}
                  />
                ))}
              </div>
              {working === 'keywords' && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  Loading keyword suggestions…
                </div>
              )}
            </div>
          )}

          {/* Selected title display */}
          {selectedTitle && phase !== 'researching' && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600">Selected Title</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedTitle}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Step 2 — Focus Keyword ── */}
      <StepCard
        number="2"
        title="Focus Keyword"
        description="Select the keyword this article targets. Locked after selection to prevent duplicates."
        locked={keywordsLocked}
      >
        {keywordChips.length > 0 && !keywordLocked && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              5 Keyword Suggestions — click to select
              {!serpDataAvailable && (
                <span className="ml-2 font-normal text-amber-600">live metrics unavailable</span>
              )}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {keywordChips.map((chip, i) => (
                <KeywordChipItem
                  key={i}
                  chip={chip}
                  selected={selectedKeyword === chip.keyword}
                  onClick={() => { if (working === null && !keywordLocked) void selectKeyword(chip); }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">Focus Keyword</label>
            <div className="relative">
              <input
                value={selectedKeyword}
                readOnly={keywordLocked}
                onChange={(e) => setSelectedKeyword(e.target.value)}
                placeholder={hasTitle ? 'Select a suggestion above or type a keyword' : 'Select a title first'}
                className={`${inputCls} ${keywordLocked ? 'pr-10' : ''}`}
                style={inputStyle}
                disabled={!hasTitle}
              />
              {keywordLocked && <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />}
            </div>
          </div>
          {keywordLocked ? (
            <GhostButton onClick={() => { setKeywordLocked(false); setOutline([]); setPhase('selecting-keyword'); }}>
              Change keyword
            </GhostButton>
          ) : (
            <PrimaryButton
              onClick={() => {
                if (selectedKeyword.trim()) void selectKeyword({ keyword: selectedKeyword.trim(), searchVolumeLabel: null, competition: null, trend: null });
              }}
              disabled={working !== null || !hasTitle || !selectedKeyword.trim()}
              loading={working === 'outline'}
            >
              {working !== 'outline' && <Check className="h-4 w-4" />}
              Use Keyword
            </PrimaryButton>
          )}
        </div>

        {duplicateKeyword && (
          <p className="mt-3 flex items-center gap-2 text-xs text-amber-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            This keyword already exists in another saved article.
          </p>
        )}

        {working === 'outline' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
            Generating article outline from research data…
          </div>
        )}
      </StepCard>

      {/* ── Step 3 — SEO Slug ── */}
      <StepCard
        number="3"
        title="SEO Slug"
        description="Auto-generated from the title. Edit directly or let AI tighten it."
        locked={slugLocked}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
              Slug <span className="font-normal text-[var(--text-muted)]">→ /blog/{slug || 'your-slug'}</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="hidden shrink-0 text-sm text-[var(--text-muted)] sm:inline">/blog/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))}
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
            AI Improve
          </GhostButton>
        </div>
      </StepCard>

      {/* ── Step 4 — Article Outline ── */}
      <StepCard
        number="4"
        title="Article Outline"
        description="AI-generated from research data. Edit headings, reorder sections, add or remove as needed."
        locked={outlineLocked}
      >
        {phase === 'loading-outline' && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating outline from PAA questions and research signals…
          </div>
        )}

        {outline.length > 0 && (
          <OutlineEditor outline={outline} onChange={setOutline} />
        )}

        {outline.length === 0 && !outlineLocked && phase !== 'loading-outline' && (
          <div
            className="rounded-xl border border-dashed p-5 text-center text-sm text-[var(--text-muted)]"
            style={{ borderColor: 'var(--border)' }}
          >
            Select a keyword above to auto-generate the outline from research data.
          </div>
        )}
      </StepCard>

      {/* ── Step 5 — Generate Article ── */}
      <StepCard
        number="5"
        title="Generate Article"
        description="Generates a complete human-first article following the outline. Edit the HTML before publishing."
        locked={generateLocked && !article}
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
                Key Takeaways · Table of Contents · H2/H3 sections · Step-by-Step Guide ·
                Examples · FAQ · Pros & Cons · Common Mistakes · Internal Links ·
                Related Calculators · CTA · References · Reading Time ·
                Meta Title · Meta Description · OpenGraph · JSON-LD Schema
              </p>
            </div>

            {generationStage && <Notice kind="info">{generationStage}</Notice>}

            {duplicateKeyword && (
              <Notice kind="error">
                Duplicate keyword — choose a different focus keyword before generating.
              </Notice>
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
                  Complete all steps above to unlock.
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
              {article.wordCount && (
                <span className="text-xs text-[var(--text-muted)]">{article.wordCount.toLocaleString()} words</span>
              )}
              {article.readingTime && (
                <span className="text-xs text-[var(--text-muted)]">{article.readingTime} min read</span>
              )}
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

            {/* Publication workflow */}
            <div
              className="flex flex-wrap items-center gap-2 rounded-xl border p-4"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}
            >
              <div className="mr-1 flex-1">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Publication workflow</p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Draft → Pending Review → Published. Never auto-published.
                  {article.status === 'pending_review' && ' Ready to publish.'}
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
                {working === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Publish
              </button>
            </div>
          </div>
        )}
      </StepCard>

      {/* ── Saved Articles ── */}
      <section className="rounded-2xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Saved Articles</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">All articles · Draft → Pending Review → Published</p>
          </div>
          <button
            type="button"
            onClick={() => void loadArticles()}
            className="rounded-lg border p-2 text-[var(--text-muted)] transition hover:border-blue-500 hover:text-blue-500"
            style={{ borderColor: 'var(--border)' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingArticles ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-5">
          {loadingArticles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-xl border border-dashed py-8 text-center text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
              No articles yet. Run the research flow above to create your first article.
            </div>
          ) : (
            <div className="space-y-2">
              {articles.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border p-3.5 transition hover:border-blue-400/40"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(a.status)}`}>
                        {statusLabel(a.status)}
                      </span>
                      <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{a.title}</p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-xs text-[var(--text-muted)]">/blog/{a.slug}</span>
                      {a.wordCount && <span className="text-xs text-[var(--text-muted)]">{a.wordCount.toLocaleString()} words</span>}
                      {a.readingTime && <span className="text-xs text-[var(--text-muted)]">{a.readingTime} min</span>}
                      {a.seoData.keywords?.[0] && (
                        <span className="rounded-full border px-2 py-0.5 text-[10px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
                          {a.seoData.keywords[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/articles/${a.id}`}
                    className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-blue-500 hover:text-blue-500"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
