'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { CALCULATORS } from '@/config/calculators';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutlineItem {
  heading: string;
  level: 'h2' | 'h3';
  subpoints: string[];
}

interface KeywordOpportunity {
  keyword: string;
  type: 'calculator' | 'article';
  searchIntent: 'informational' | 'transactional';
  opportunityScore: number;
  estimatedMonthlySearches: string;
  competitionLevel: 'low' | 'medium' | 'high';
  trendMomentum: 'rising' | 'stable' | 'declining';
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
  niche: string;
}

interface Article {
  id: string;
  calculatorId: string;
  slug: string;
  title: string;
  content: string;
  status: 'draft' | 'pending_review' | 'published';
  seoData: {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl: string;
  };
  version: number;
  createdAt: string;
}

type WorkspaceView = 'discovery' | 'drafts' | 'editor';

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${color}`}>
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score || 0));
  const color = clamped >= 75 ? '#22c55e' : clamped >= 50 ? '#f59e0b' : '#ef4444';
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="900" fill={color}>{clamped}</text>
      </svg>
      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Score</span>
    </div>
  );
}

function CompetitionPill({ level }: { level: string }) {
  const map: Record<string, string> = {
    low: 'bg-green-500/10 text-green-500',
    medium: 'bg-yellow-500/10 text-yellow-500',
    high: 'bg-red-500/10 text-red-500',
  };
  return <Badge label={`${level} comp.`} color={map[level] ?? 'bg-gray-500/10 text-gray-500'} />;
}

function TrendPill({ momentum }: { momentum: string }) {
  const map: Record<string, string> = {
    rising: 'bg-emerald-500/10 text-emerald-500',
    stable: 'bg-blue-500/10 text-blue-500',
    declining: 'bg-red-500/10 text-red-500',
  };
  const icon: Record<string, string> = { rising: '↑', stable: '→', declining: '↓' };
  return <Badge label={`${icon[momentum] ?? ''} ${momentum}`} color={map[momentum] ?? 'bg-gray-500/10 text-gray-500'} />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-green-500/15 text-green-500',
    pending_review: 'bg-yellow-500/15 text-yellow-500',
    draft: 'bg-gray-500/15 text-gray-400',
  };
  return (
    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${map[status] ?? 'bg-gray-500/10 text-gray-400'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ── Opportunity Card ──────────────────────────────────────────────────────────

function OpportunityCard({
  opp,
  index,
  onBuildCalculator,
  onWriteArticle,
  dispatching,
}: {
  opp: KeywordOpportunity;
  index: number;
  onBuildCalculator: (opp: KeywordOpportunity) => void;
  onWriteArticle: (opp: KeywordOpportunity) => void;
  dispatching: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDispatching = dispatching === opp.keyword;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {/* Card header */}
      <div className="p-5 flex items-start gap-4">
        <ScoreRing score={opp.opportunityScore} />

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
            >
              {index + 1}
            </span>
            <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              {opp.keyword}
            </h3>
            <Badge
              label={opp.type === 'calculator' ? '🧮 Calculator' : '✍️ Article'}
              color={opp.type === 'calculator' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}
            />
            <Badge
              label={opp.searchIntent}
              color={opp.searchIntent === 'transactional' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}
            />
          </div>

          {/* Metric row */}
          <div className="flex flex-wrap items-center gap-2">
            {opp.estimatedMonthlySearches && (
              <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-[var(--text-muted)]">📊 Vol:</span> {opp.estimatedMonthlySearches}/mo
              </span>
            )}
            {opp.competitionLevel && <CompetitionPill level={opp.competitionLevel} />}
            {opp.trendMomentum && <TrendPill momentum={opp.trendMomentum} />}
          </div>

          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{opp.intentAnalysis}</p>

          {/* Meta preview */}
          <div className="rounded-xl p-3 space-y-1 text-xs border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <p className="font-bold text-blue-500 truncate">🔵 {opp.metaTitle}</p>
            <p style={{ color: 'var(--text-muted)' }}>{opp.metaDescription}</p>
            {opp.urlSlug && (
              <p className="font-mono text-[10px] pt-0.5" style={{ color: 'var(--text-muted)' }}>
                🔗 /{opp.urlSlug}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest border-t flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        <span>{expanded ? '▲ Collapse SEO Brief' : '▼ View Full SEO Brief'}</span>
        <span>{opp.outline.length} headings · {opp.secondaryKeywords.length} LSI keywords</span>
      </button>

      {expanded && (
        <div className="p-5 border-t space-y-5" style={{ borderColor: 'var(--border)' }}>
          <Section title="5 High-CTR Title Options">
            <ol className="space-y-1.5">
              {opp.titles.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span
                    className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{t}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Primary Keyword + LSI Keywords">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-600 text-white">{opp.primaryKeyword}</span>
              {opp.secondaryKeywords.map((kw, i) => (
                <span key={i} className="px-3 py-1 rounded-xl text-xs font-semibold border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  {kw}
                </span>
              ))}
            </div>
          </Section>

          <Section title="H2/H3 Heading Outline">
            <div className="space-y-2">
              {opp.outline.map((item, i) => (
                <div key={i} className={item.level === 'h3' ? 'ml-4' : ''}>
                  <p className={`text-xs font-bold ${item.level === 'h2' ? '' : 'font-semibold'}`}
                    style={{ color: item.level === 'h2' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {item.level === 'h2' ? '## ' : '### '}{item.heading}
                  </p>
                  {item.subpoints?.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-0.5">
                      {item.subpoints.map((sp, j) => (
                        <li key={j} className="text-[11px]" style={{ color: 'var(--text-muted)' }}>· {sp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Meta Tags">
            <div className="rounded-xl p-3 space-y-2 border text-xs" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
              <div className="flex items-start gap-2">
                <span className="font-black uppercase text-[9px] tracking-widest w-24 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>Meta Title</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {opp.metaTitle}
                  <span className={`ml-2 text-[9px] font-bold ${opp.metaTitle.length > 60 ? 'text-red-500' : 'text-green-500'}`}>
                    ({opp.metaTitle.length}/60)
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black uppercase text-[9px] tracking-widest w-24 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>Meta Desc</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {opp.metaDescription}
                  <span className={`ml-2 text-[9px] font-bold ${opp.metaDescription.length > 155 ? 'text-red-500' : 'text-green-500'}`}>
                    ({opp.metaDescription.length}/155)
                  </span>
                </span>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-5 py-3.5 border-t flex items-center gap-3 flex-wrap"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
        {opp.type === 'calculator' && (
          <Link
            href={`/admin/factory?prompt=${encodeURIComponent(
              `${opp.keyword}. Keywords: ${opp.primaryKeyword}, ${opp.secondaryKeywords.slice(0, 2).join(', ')}. ${opp.intentAnalysis}`,
            )}`}
            onClick={() => onBuildCalculator(opp)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            🧮 Build Calculator
          </Link>
        )}
        <button
          onClick={() => onWriteArticle(opp)}
          disabled={!!dispatching}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
        >
          {isDispatching ? '⏳ Generating…' : '✍️ Generate Article'}
        </button>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Score: {opp.opportunityScore}/100 · {opp.estimatedMonthlySearches || '?'} searches/mo
        </span>
      </div>
    </div>
  );
}

// ── Article List Row ──────────────────────────────────────────────────────────

function ArticleRow({
  article,
  onEdit,
  onDelete,
  onPublish,
}: {
  article: Article;
  onEdit: (a: Article) => void;
  onDelete: (id: string) => void;
  onPublish: (a: Article) => void;
}) {
  const wordCount = article.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  const linkedCalc = CALCULATORS.find((c) => c.slug === article.calculatorId);

  return (
    <div className="p-5 flex items-center gap-4 hover:bg-[var(--bg-card-hover)] transition">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{article.title}</h2>
          <StatusBadge status={article.status} />
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-mono">/blog/{article.slug}</span>
          {linkedCalc && (
            <span className="ml-3">
              🔗 <span className="text-blue-500">{linkedCalc.name}</span>
            </span>
          )}
          <span className="ml-3">{wordCount.toLocaleString()} words</span>
          <span className="ml-3">v{article.version}</span>
          <span className="ml-3">{new Date(article.createdAt).toLocaleDateString()}</span>
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {article.status !== 'published' && (
          <button
            onClick={() => onPublish(article)}
            className="text-xs font-bold text-green-500 hover:underline"
          >
            Publish
          </button>
        )}
        <button onClick={() => onEdit(article)} className="text-xs font-bold text-blue-500 hover:underline">
          Edit
        </button>
        <span style={{ color: 'var(--border)' }}>|</span>
        <button onClick={() => onDelete(article.id)} className="text-xs font-bold text-red-500 hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Article Editor (Rich Split-Pane) ──────────────────────────────────────────

function ArticleEditor({
  article,
  onSave,
  onCancel,
}: {
  article: Partial<Article>;
  onSave: (updated: Partial<Article>) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Article>>(article);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview' | 'split'>('split');

  // Detect calculator links embedded in content
  const detectedLinks = CALCULATORS.filter((c) => {
    const content = draft.content ?? '';
    return content.includes(`/${c.slug}`) || content.toLowerCase().includes(c.name.toLowerCase());
  });

  // Auto-generate slug from title
  const handleTitleChange = (t: string) => {
    const slug = draft.slug || t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setDraft((d) => ({ ...d, title: t, slug: d.slug ? d.slug : slug }));
  };

  const handleSubmit = async (status?: 'draft' | 'pending_review' | 'published') => {
    setSaving(true);
    try {
      await onSave(status ? { ...draft, status } : draft);
    } finally {
      setSaving(false);
    }
  };

  const injectCalculatorLink = (calc: typeof CALCULATORS[0]) => {
    const linkHtml = `<a href="/${calc.slug}" title="${calc.name}">${calc.name}</a>`;
    const regex = new RegExp(`(?<!href=["'][^"']*)(\\b${calc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)(?![^<]*>)`, 'i');
    const newContent = (draft.content ?? '').replace(regex, linkHtml);
    if (newContent !== draft.content) {
      setDraft((d) => ({ ...d, content: newContent }));
      toast.success(`Linked "${calc.name}" in article`);
    } else {
      // Append a reference section if name not found in body
      setDraft((d) => ({
        ...d,
        content: (d.content ?? '') + `\n<p>Use our free <a href="/${calc.slug}">${calc.name}</a> to get instant results.</p>`,
      }));
      toast.success(`Appended link to "${calc.name}"`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1">
            ← Back to Drafts
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <h2 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
            {draft.id ? `Editing: ${draft.title || 'Untitled'}` : 'New Article'}
          </h2>
          {draft.status && <StatusBadge status={draft.status} />}
        </div>
        <div className="flex items-center gap-2">
          {(['editor', 'split', 'preview'] as const).map((m) => (
            <button key={m} onClick={() => setPreviewMode(m)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition ${
                previewMode === m ? 'bg-blue-600 text-white border-blue-600' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'
              }`}>
              {m === 'split' ? '⊞ Split' : m === 'editor' ? '✏️ Code' : '👁 Preview'}
            </button>
          ))}
        </div>
      </div>

      {/* Meta fields */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Article Title *</label>
            <input type="text" required value={draft.title || ''} onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. How Is Your Mortgage Payment Calculated?"
              className="w-full p-3 border rounded-xl outline-none text-sm"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>URL Slug</label>
            <input type="text" value={draft.slug || ''} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              placeholder="e.g. mortgage-payment-calculation"
              className="w-full p-3 border rounded-xl outline-none text-sm font-mono"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Meta Title</label>
            <input type="text" value={draft.seoData?.title || ''} placeholder="SEO meta title (≤60 chars)"
              onChange={(e) => setDraft((d) => ({ ...d, seoData: { ...d.seoData!, title: e.target.value } }))}
              className="w-full p-3 border rounded-xl outline-none text-sm"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
            <p className={`text-[10px] mt-1 ${(draft.seoData?.title?.length ?? 0) > 60 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
              {draft.seoData?.title?.length ?? 0}/60 chars
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Meta Description</label>
            <input type="text" value={draft.seoData?.description || ''} placeholder="SEO meta description (≤155 chars)"
              onChange={(e) => setDraft((d) => ({ ...d, seoData: { ...d.seoData!, description: e.target.value } }))}
              className="w-full p-3 border rounded-xl outline-none text-sm"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
            <p className={`text-[10px] mt-1 ${(draft.seoData?.description?.length ?? 0) > 155 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
              {draft.seoData?.description?.length ?? 0}/155 chars
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Link to Calculator</label>
            <select value={draft.calculatorId || ''}
              onChange={(e) => setDraft((d) => ({ ...d, calculatorId: e.target.value }))}
              className="w-full p-3 border rounded-xl outline-none text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <option value="">No link (General article)</option>
              {CALCULATORS.map((c) => (
                <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Publishing Status</label>
            <select value={draft.status || 'draft'}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as Article['status'] }))}
              className="w-full p-3 border rounded-xl outline-none text-sm cursor-pointer"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <option value="draft">Draft (Private)</option>
              <option value="pending_review">Pending Review</option>
              <option value="published">Published (Public)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Split pane: editor + preview */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className={`flex ${previewMode === 'split' ? 'flex-col md:flex-row' : 'flex-col'}`} style={{ minHeight: 520 }}>
          {/* Code editor */}
          {(previewMode === 'editor' || previewMode === 'split') && (
            <div className={`flex flex-col ${previewMode === 'split' ? 'md:w-1/2' : 'w-full'} border-r`} style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>HTML Source</span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {draft.content?.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length ?? 0} words
                </span>
              </div>
              <textarea
                value={draft.content || ''}
                onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                placeholder="Article HTML content…"
                className="flex-1 w-full p-4 outline-none text-xs font-mono leading-relaxed resize-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: 480 }}
              />
            </div>
          )}

          {/* Live preview */}
          {(previewMode === 'preview' || previewMode === 'split') && (
            <div className={`flex flex-col ${previewMode === 'split' ? 'md:w-1/2' : 'w-full'}`}>
              <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Rendered Preview</span>
              </div>
              <div
                className="flex-1 p-6 overflow-y-auto prose prose-sm max-w-none text-[var(--text-primary)]"
                style={{ minHeight: 480 }}
                dangerouslySetInnerHTML={{ __html: draft.content || '<p style="color:var(--text-muted);font-style:italic;">Start typing in the editor to see a live preview…</p>' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Internal Link Mapper */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
              🔗 Internal Calculator Link Mapper
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {detectedLinks.length > 0
                ? `${detectedLinks.length} calculator${detectedLinks.length > 1 ? 's' : ''} referenced in this article`
                : 'No calculator links detected — click a calculator below to inject a contextual link'}
            </p>
          </div>
          {detectedLinks.length > 0 && (
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-green-500/10 text-green-500">
              {detectedLinks.length} linked
            </span>
          )}
        </div>

        {detectedLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {detectedLinks.map((c) => (
              <span key={c.slug} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-green-500/5 border-green-500/20 text-green-500">
                {c.icon} {c.name} <span className="text-green-400">✓</span>
              </span>
            ))}
          </div>
        )}

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Quick-Inject Calculator Links
          </p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {CALCULATORS.map((c) => {
              const alreadyLinked = detectedLinks.some((d) => d.slug === c.slug);
              return (
                <button
                  key={c.slug}
                  onClick={() => injectCalculatorLink(c)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                    alreadyLinked
                      ? 'border-green-500/30 text-green-500 bg-green-500/5'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-blue-500/30 hover:text-blue-500 hover:bg-blue-500/5'
                  }`}
                >
                  {c.icon} {c.shortName} {alreadyLinked ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onCancel} className="px-5 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--bg-card-hover)] transition"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <button
            disabled={saving}
            onClick={() => handleSubmit('draft')}
            className="px-5 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--bg-card-hover)] transition disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            {saving ? '⏳ Saving…' : '💾 Save Draft'}
          </button>
          <button
            disabled={saving}
            onClick={() => handleSubmit('pending_review')}
            className="px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-yellow-500/20 transition disabled:opacity-50"
          >
            📋 Send for Review
          </button>
          <button
            disabled={saving || !draft.title || !draft.content}
            onClick={() => handleSubmit('published')}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-green-600/20 disabled:opacity-50"
          >
            {saving ? '⏳…' : '🚀 Publish Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const NICHES = ['Finance', 'Health & Fitness', 'Real Estate', 'Education', 'Lifestyle', 'Math & Science'];

export default function EditorialWorkspacePage() {
  const [view, setView] = useState<WorkspaceView>('discovery');

  // ── Discovery state ──
  const [niche, setNiche] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [result, setResult] = useState<FinderResult | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);

  // ── Drafts state ──
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch('/api/admin/blog');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load articles');
    } finally {
      setLoadingArticles(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // ── Discovery handlers ──
  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;
    setDiscovering(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/seo-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: niche.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Discovery failed');
      setResult(data);
      toast.success(`Found ${data.opportunities.length} keyword opportunities`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Discovery failed');
    } finally {
      setDiscovering(false);
    }
  };

  const handleWriteArticle = async (opp: KeywordOpportunity) => {
    setDispatching(opp.keyword);
    try {
      const res = await fetch('/api/admin/seo-finder/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: opp.keyword,
          primaryKeyword: opp.primaryKeyword,
          secondaryKeywords: opp.secondaryKeywords,
          titles: opp.titles,
          intentAnalysis: opp.intentAnalysis,
          outline: opp.outline,
          metaTitle: opp.metaTitle,
          metaDescription: opp.metaDescription,
          urlSlug: opp.urlSlug,
        }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        toast.success(`"${d.article.title}" generated — opening in Editor`);
        await fetchArticles();
        setEditingArticle(d.article as Article);
        setView('editor');
      } else {
        toast.error(d.error || 'Failed to generate article');
      }
    } catch {
      toast.error('Failed to dispatch article generation');
    } finally {
      setDispatching(null);
    }
  };

  const handleBuildCalculator = () => toast.success('Opening AI Calculator Factory…');

  // ── Drafts handlers ──
  const handleEdit = (article: Article) => {
    setEditingArticle({ ...article });
    setView('editor');
  };

  const handleCreateNew = () => {
    setEditingArticle({
      title: '', slug: '', content: '', status: 'draft', calculatorId: '',
      seoData: { title: '', description: '', keywords: [], canonicalUrl: '' },
    });
    setView('editor');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        toast.success('Article deleted');
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handlePublish = async (article: Article) => {
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...article, status: 'published' }),
      });
      if (res.ok) {
        const d = await res.json();
        setArticles((prev) => prev.map((a) => (a.id === d.article.id ? d.article : a)));
        toast.success('Article published');
      }
    } catch {
      toast.error('Publish failed');
    }
  };

  const handleSaveArticle = async (updated: Partial<Article>) => {
    if (!updated.title || !updated.content) {
      toast.error('Title and content are required');
      return;
    }
    const res = await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const d = await res.json();
      setArticles((prev) => {
        const idx = prev.findIndex((a) => a.id === d.article.id);
        return idx > -1 ? prev.map((a) => (a.id === d.article.id ? d.article : a)) : [d.article, ...prev];
      });
      toast.success(updated.id ? 'Article updated' : 'Article created');
      setEditingArticle(null);
      setView('drafts');
    } else {
      toast.error('Failed to save article');
    }
  };

  const statusCounts = {
    all: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    draft: articles.filter((a) => a.status === 'draft').length,
    pending: articles.filter((a) => a.status === 'pending_review').length,
  };

  return (
    <div className="space-y-6">
      {/* ── Full-screen generation overlay ───────────────────────────────── */}
      {dispatching && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="flex flex-col items-center gap-4 max-w-sm text-center px-8">
            {/* Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl">✍️</span>
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight">AI is crafting your article…</p>
              <p className="text-purple-300 text-sm mt-1 font-medium">"{dispatching}"</p>
              <p className="text-white/50 text-xs mt-3 leading-relaxed">
                Writing 1,400–2,000 words · Building Key Takeaways · Adding FAQ Schema · Injecting calculator links
              </p>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Editorial Workspace
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Keyword discovery, AI article generation, and editorial publishing — unified in one workflow.
          </p>
        </div>
        {view === 'drafts' && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            ✏️ New Article
          </button>
        )}
      </div>

      {/* ── Tabs (hidden in editor view) ──────────────────────────────────── */}
      {view !== 'editor' && (
        <div className="flex items-center gap-1 p-1 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {([
            { id: 'discovery', label: '🔍 Keyword Discovery', count: result?.opportunities.length },
            { id: 'drafts', label: '✍️ Article Drafts', count: statusCounts.all },
          ] as { id: WorkspaceView; label: string; count?: number }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                view === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${view === tab.id ? 'bg-white/20' : 'bg-[var(--bg-input)]'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Discovery View ─────────────────────────────────────────────────── */}
      {view === 'discovery' && (
        <div className="space-y-6">
          {/* Model indicator */}
          <div className="flex flex-wrap gap-4 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="font-black" style={{ color: 'var(--text-primary)' }}>Code Generation:</span>
              <code className="font-mono px-1.5 py-0.5 rounded text-blue-500" style={{ backgroundColor: 'var(--bg-input)' }}>poolside/laguna-xs-2.1</code>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
              <span className="font-black" style={{ color: 'var(--text-primary)' }}>Content & SEO:</span>
              <code className="font-mono px-1.5 py-0.5 rounded text-purple-500" style={{ backgroundColor: 'var(--bg-input)' }}>google/gemma-4-31b</code>
            </div>
          </div>

          {/* Search form */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">Discover Keyword Opportunities</h2>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <button key={n} onClick={() => setNiche(n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    niche === n ? 'bg-blue-600 text-white border-blue-600' : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
            <form onSubmit={handleDiscover} className="flex gap-3">
              <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. Finance, Health, Real Estate, Education…" disabled={discovering}
                className="flex-1 p-3 border rounded-xl outline-none text-sm"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
              <button type="submit" disabled={discovering || !niche.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/25 whitespace-nowrap">
                {discovering ? '⏳ Discovering…' : '🔍 Discover'}
              </button>
            </form>
            {discovering && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">SEO Analysis Pipeline Running</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Fetching Google Autocomplete data → Analyzing search intent → Scoring opportunities with <code className="font-mono">google/gemma-4-31b</code>…
                </p>
                <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}
          </div>

          {/* Raw autocomplete */}
          {result && result.rawSuggestions.length > 0 && (
            <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
                📡 Real Google Search Queries — Live Autocomplete Data
              </h2>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Actual queries people type into Google for &quot;{result.niche}&quot; — analyzed to identify opportunities below.
              </p>
              <div className="flex flex-wrap gap-2">
                {result.rawSuggestions.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-xl text-[11px] border cursor-default"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Opportunity dashboard summary */}
          {result && result.opportunities.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Opportunities', value: result.opportunities.length, color: 'text-blue-500' },
                  { label: 'Calculator Ideas', value: result.opportunities.filter((o) => o.type === 'calculator').length, color: 'text-blue-500' },
                  { label: 'Article Ideas', value: result.opportunities.filter((o) => o.type === 'article').length, color: 'text-purple-500' },
                  {
                    label: 'Avg Score',
                    value: Math.round(result.opportunities.reduce((s, o) => s + (o.opportunityScore || 0), 0) / result.opportunities.length),
                    color: 'text-green-500',
                  },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {result.opportunities.length} Keyword Opportunities — Ranked by Search Opportunity Score
                </h2>
                {[...result.opportunities]
                  .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
                  .map((opp, i) => (
                    <OpportunityCard
                      key={opp.keyword + i}
                      opp={opp}
                      index={i}
                      onBuildCalculator={handleBuildCalculator}
                      onWriteArticle={handleWriteArticle}
                      dispatching={dispatching}
                    />
                  ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {!result && !discovering && (
            <div className="rounded-2xl border p-12 text-center space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="text-4xl">🎯</div>
              <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Ready to Find Keyword Opportunities</h3>
              <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                Enter a seed niche above to discover low-competition calculator and article opportunities powered by real-time Google Autocomplete data and AI analysis.
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Requires an OpenRouter API Key — configure it in{' '}
                <Link href="/admin/settings" className="text-blue-500 hover:underline">Platform Settings</Link>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Drafts View ────────────────────────────────────────────────────── */}
      {view === 'drafts' && (
        <div className="space-y-4">
          {/* Status summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Articles', value: statusCounts.all, color: 'text-blue-500' },
              { label: 'Published', value: statusCounts.published, color: 'text-green-500' },
              { label: 'Pending Review', value: statusCounts.pending, color: 'text-yellow-500' },
              { label: 'Drafts', value: statusCounts.draft, color: 'text-gray-400' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {loadingArticles ? (
              <div className="p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading articles…</div>
            ) : articles.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-4xl">✍️</div>
                <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>No Articles Yet</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Create your first article manually, or go to{' '}
                  <button onClick={() => setView('discovery')} className="text-blue-500 hover:underline">Keyword Discovery</button>{' '}
                  to generate AI-written articles from keyword opportunities.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {articles.map((art) => (
                  <ArticleRow
                    key={art.id}
                    article={art}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPublish={handlePublish}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Editor View ────────────────────────────────────────────────────── */}
      {view === 'editor' && editingArticle && (
        <ArticleEditor
          article={editingArticle}
          onSave={handleSaveArticle}
          onCancel={() => { setEditingArticle(null); setView('drafts'); }}
        />
      )}
    </div>
  );
}
