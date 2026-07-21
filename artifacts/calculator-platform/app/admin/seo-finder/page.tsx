'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

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
  titles: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  intentAnalysis: string;
  outline: OutlineItem[];
  metaTitle: string;
  metaDescription: string;
}

interface FinderResult {
  opportunities: KeywordOpportunity[];
  rawSuggestions: string[];
  niche: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${color}`}
    >
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
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Card header */}
      <div className="p-5 flex items-start gap-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 mt-0.5"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              {opp.keyword}
            </h3>
            <Badge
              label={opp.type === 'calculator' ? '🧮 Calculator' : '✍️ Article'}
              color={opp.type === 'calculator' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}
            />
            <Badge
              label={opp.searchIntent}
              color={
                opp.searchIntent === 'transactional'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-orange-500/10 text-orange-500'
              }
            />
          </div>

          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {opp.intentAnalysis}
          </p>

          {/* Meta preview */}
          <div
            className="rounded-xl p-3 space-y-1 text-xs border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
          >
            <p className="font-bold text-blue-500 truncate">🔵 {opp.metaTitle}</p>
            <p style={{ color: 'var(--text-muted)' }}>{opp.metaDescription}</p>
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
          {/* Titles */}
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

          {/* Keywords */}
          <Section title="Primary Keyword + LSI Keywords">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-600 text-white">
                {opp.primaryKeyword}
              </span>
              {opp.secondaryKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl text-xs font-semibold border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </Section>

          {/* Outline */}
          <Section title="H2/H3 Heading Outline">
            <div className="space-y-2">
              {opp.outline.map((item, i) => (
                <div key={i} className={item.level === 'h3' ? 'ml-4' : ''}>
                  <p
                    className={`text-xs font-bold ${item.level === 'h2' ? '' : 'font-semibold'}`}
                    style={{ color: item.level === 'h2' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {item.level === 'h2' ? '## ' : '### '}{item.heading}
                  </p>
                  {item.subpoints?.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-0.5">
                      {item.subpoints.map((sp, j) => (
                        <li key={j} className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          · {sp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Meta */}
          <Section title="Meta Tags">
            <div
              className="rounded-xl p-3 space-y-2 border text-xs"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-2">
                <span className="font-black uppercase text-[9px] tracking-widest w-24 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Meta Title
                </span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {opp.metaTitle}
                  <span className={`ml-2 text-[9px] font-bold ${opp.metaTitle.length > 60 ? 'text-red-500' : 'text-green-500'}`}>
                    ({opp.metaTitle.length}/60)
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black uppercase text-[9px] tracking-widest w-24 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Meta Desc
                </span>
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
      <div
        className="px-5 py-3.5 border-t flex items-center gap-3 flex-wrap"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}
      >
        {opp.type === 'calculator' ? (
          <Link
            href={`/admin/factory?prompt=${encodeURIComponent(
              `${opp.keyword}. Keywords: ${opp.primaryKeyword}, ${opp.secondaryKeywords.slice(0, 2).join(', ')}. ${opp.intentAnalysis}`,
            )}`}
            onClick={() => onBuildCalculator(opp)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            🧮 Build Calculator
          </Link>
        ) : (
          <button
            onClick={() => onWriteArticle(opp)}
            disabled={!!dispatching}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
          >
            {isDispatching ? '⏳ Dispatching…' : '✍️ Generate Article'}
          </button>
        )}
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Model: {opp.type === 'calculator' ? 'poolside/laguna-xs-2.1' : 'google/gemma-4-31b'}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const NICHES = ['Finance', 'Health & Fitness', 'Real Estate', 'Education', 'Lifestyle', 'Math & Science'];

export default function SEOFinderPage() {
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinderResult | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleWriteArticle = async (opp: KeywordOpportunity) => {
    setDispatching(opp.keyword);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculatorId: `seo_${Date.now()}`,
          calculatorName: opp.keyword,
          keywords: [opp.primaryKeyword, ...opp.secondaryKeywords],
          title: opp.titles[0],
        }),
      });
      if (res.ok) {
        toast.success(`Article queued: "${opp.titles[0]}"`);
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to queue article');
      }
    } catch {
      toast.error('Failed to dispatch article generation');
    } finally {
      setDispatching(null);
    }
  };

  const handleBuildCalculator = (_opp: KeywordOpportunity) => {
    toast.success('Opening AI Calculator Factory…');
  };

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          SEO Content & Keyword Finder
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Enter a seed niche to discover low-competition calculator and article opportunities powered by real Google search data.
        </p>
      </div>

      {/* ── Model indicator ────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap gap-4 p-4 rounded-2xl border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="font-black" style={{ color: 'var(--text-primary)' }}>Code Generation:</span>
          <code className="font-mono px-1.5 py-0.5 rounded text-blue-500" style={{ backgroundColor: 'var(--bg-input)' }}>
            poolside/laguna-xs-2.1
          </code>
          <span style={{ color: 'var(--text-muted)' }}>→ fallback:</span>
          <code className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            google/gemma-4-31b
          </code>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
          <span className="font-black" style={{ color: 'var(--text-primary)' }}>Content & SEO:</span>
          <code className="font-mono px-1.5 py-0.5 rounded text-purple-500" style={{ backgroundColor: 'var(--bg-input)' }}>
            google/gemma-4-31b
          </code>
          <span style={{ color: 'var(--text-muted)' }}>→ fallback:</span>
          <code className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            google/gemma-4-26b-a4b
          </code>
        </div>
      </div>

      {/* ── Input form ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
          Discover Keyword Opportunities
        </h2>

        {/* Quick niche chips */}
        <div className="flex flex-wrap gap-2">
          {NICHES.map((n) => (
            <button
              key={n}
              onClick={() => setNiche(n)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                niche === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <form onSubmit={handleDiscover} className="flex gap-3">
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. Finance, Health, Real Estate, Education…"
            disabled={loading}
            className="flex-1 p-3 border rounded-xl outline-none text-sm"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={loading || !niche.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/25 whitespace-nowrap"
          >
            {loading ? '⏳ Discovering…' : '🔍 Discover Opportunities'}
          </button>
        </form>

        {loading && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                SEO Analysis Pipeline Running
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Fetching real Google Autocomplete data → Analyzing search intent → Generating keyword briefs with{' '}
              <code className="font-mono">google/gemma-4-31b</code>…
            </p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Raw autocomplete suggestions ───────────────────────────────────── */}
      {result && result.rawSuggestions.length > 0 && (
        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
            📡 Real Google Search Queries — Live Autocomplete Data
          </h2>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            These are actual queries people type into Google for "{result.niche}". The AI analyzed these to identify the best opportunities below.
          </p>
          <div className="flex flex-wrap gap-2">
            {result.rawSuggestions.map((s, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-xl text-[11px] border cursor-default"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Opportunities ──────────────────────────────────────────────────── */}
      {result && result.opportunities.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {result.opportunities.length} Keyword Opportunities — Low Competition, High CTR
            </h2>
            <div className="flex gap-2 text-[10px]">
              <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-bold">
                {result.opportunities.filter((o) => o.type === 'calculator').length} Calculators
              </span>
              <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-500 font-bold">
                {result.opportunities.filter((o) => o.type === 'article').length} Articles
              </span>
            </div>
          </div>

          {result.opportunities.map((opp, i) => (
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
      )}
    </div>
  );
}
