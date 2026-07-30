'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Zap,
  FlaskConical,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Clock,
  Calculator,
  Activity,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Opportunity {
  keyword: string;
  calculatorName: string;
  category: string;
  searchVolume: string;
  competition: string;
  trend: 'rising' | 'stable' | 'declining';
  opportunityScore: number;
  estimatedTraffic: string;
  description: string;
  urlSlug: string;
  rationale: string;
}

interface GeneratedSpec {
  name: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  inputs: Array<{ name: string; label: string; type: string }>;
  outputs: Array<{ name: string; label: string; highlight?: boolean }>;
  calculateBody: string;
  formula?: { expression: string; variables: { symbol: string; definition: string }[] };
  examples?: { title: string; scenario: string; steps: string[]; result: string }[];
  tests?: TestCase[];
  howToUse?: string[];
  faqItems?: { question: string; answer: string }[];
  keywords?: string[];
  shortDescription?: string;
  internalLinks?: { text: string; slug: string }[];
}

interface TestCase {
  name: string;
  type: 'unit' | 'edge' | 'formula';
  inputs: Record<string, number | string>;
  expectedOutputs: Record<string, number | string>;
  tolerance?: number;
}

interface TestResult {
  name: string;
  type: 'unit' | 'edge' | 'formula';
  passed: boolean;
  actual?: Record<string, unknown>;
  expected: Record<string, number | string>;
  error?: string;
}

interface StoredCalc {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  metadata: {
    testStatus?: 'pending' | 'passed' | 'failed';
    lastTestRun?: string;
    inputs?: unknown[];
    outputs?: unknown[];
  };
  createdAt: string;
}

type View = 'list' | 'research' | 'configure' | 'generating' | 'review' | 'done';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(n: number) {
  if (n >= 70) return 'text-emerald-500';
  if (n >= 40) return 'text-amber-500';
  return 'text-red-500';
}

function scoreBar(n: number) {
  const color = n >= 70 ? 'bg-emerald-500' : n >= 40 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${n}%` }} />
      </div>
      <span className={`text-xs font-bold w-7 text-right ${scoreColor(n)}`}>{n}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === 'declining') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
}

function CompBadge({ level }: { level: string }) {
  const map: Record<string, string> = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };
  return <span className={`text-xs font-semibold capitalize ${map[level] ?? ''}`}>{level}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return status === 'active' ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/15 text-zinc-400">
      Inactive
    </span>
  );
}

function TestBadge({ status }: { status?: string }) {
  if (status === 'passed') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
      <CheckCircle className="w-3 h-3" /> Passed
    </span>
  );
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    unit: 'bg-blue-500/15 text-blue-400',
    edge: 'bg-purple-500/15 text-purple-400',
    formula: 'bg-amber-500/15 text-amber-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${map[type] ?? ''}`}>
      {type}
    </span>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s*calculator\s*/gi, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalculatorsPage() {
  // List state
  const [calculators, setCalculators] = useState<StoredCalc[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [deleteSlug, setDeleteSlug] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Workflow
  const [view, setView] = useState<View>('list');

  // Research
  const [researchQuery, setResearchQuery] = useState('');
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // Configure
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [calcName, setCalcName] = useState('');
  const [calcSlug, setCalcSlug] = useState('');

  // Generate
  const [genStage, setGenStage] = useState('');
  const [genError, setGenError] = useState('');
  const [generatedSpec, setGeneratedSpec] = useState<GeneratedSpec | null>(null);

  // Review / tests
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSummary, setTestSummary] = useState({ passed: 0, failed: 0, total: 0 });
  const [allPassed, setAllPassed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [enableError, setEnableError] = useState('');

  // ── Load list ───────────────────────────────────────────────────────────────

  const loadCalculators = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const res = await fetch('/api/admin/factory/save');
      if (!res.ok) throw new Error('Failed to load calculators');
      const data = await res.json();
      setCalculators(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadCalculators(); }, [loadCalculators]);

  // ── Research ────────────────────────────────────────────────────────────────

  const handleResearch = async () => {
    if (!researchQuery.trim()) return;
    setResearching(true);
    setResearchError('');
    setOpportunities([]);
    try {
      const res = await fetch('/api/admin/factory/keywords', {
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

  // ── Select opportunity ──────────────────────────────────────────────────────

  const selectOpportunity = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setCalcName(opp.calculatorName || `${opp.keyword} Calculator`);
    setCalcSlug(opp.urlSlug || slugify(opp.keyword));
    setGenError('');
    setView('configure');
  };

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selectedOpp || !calcName.trim()) return;
    setGenError('');
    setGeneratedSpec(null);
    setTestResults([]);
    setAllPassed(false);
    setView('generating');

    const stages = [
      'Analyzing search opportunity...',
      'Designing calculator inputs & outputs...',
      'Writing mathematical formula...',
      'Building calculation engine...',
      'Generating worked examples...',
      'Writing FAQ & How-To content...',
      'Generating SEO metadata & JSON-LD...',
      'Writing unit tests...',
      'Writing edge case tests...',
      'Writing formula validation tests...',
      'Saving to database...',
    ];
    let si = 0;
    setGenStage(stages[0]);
    const interval = setInterval(() => {
      si = Math.min(si + 1, stages.length - 1);
      setGenStage(stages[si]);
    }, 7000);

    try {
      // Stage 1: Generate full spec + tests
      const prompt = `${calcName.trim()} — ${selectedOpp.description || selectedOpp.keyword}`;
      const genRes = await fetch('/api/admin/factory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Generation failed');

      // Override slug/name with what admin configured
      genData.slug = calcSlug || genData.slug;
      genData.name = calcName || genData.name;

      // Attach opportunity data for tracking
      genData.opportunityData = {
        searchVolume: selectedOpp.searchVolume,
        competition: selectedOpp.competition,
        trend: selectedOpp.trend,
        opportunityScore: selectedOpp.opportunityScore,
        estimatedTraffic: selectedOpp.estimatedTraffic,
      };

      setGenStage('Saving to database...');

      // Stage 2: Save (inactive by default)
      const saveRes = await fetch('/api/admin/factory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genData),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || 'Save failed');

      clearInterval(interval);
      setGeneratedSpec(genData as GeneratedSpec);

      // Auto-run tests
      if (Array.isArray(genData.tests) && genData.tests.length > 0) {
        setView('review');
        await runTests(genData as GeneratedSpec);
      } else {
        setView('review');
      }
    } catch (e: unknown) {
      clearInterval(interval);
      setGenError(e instanceof Error ? e.message : 'Generation failed');
      setView('configure');
    }
  };

  // ── Run tests ───────────────────────────────────────────────────────────────

  const runTests = async (spec: GeneratedSpec) => {
    if (!spec.tests?.length) return;
    setTesting(true);
    setTestResults([]);
    try {
      const res = await fetch('/api/admin/factory/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculateBody: spec.calculateBody,
          tests: spec.tests,
          slug: spec.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test run failed');
      setTestResults(data.results || []);
      setTestSummary({ passed: data.passed, failed: data.failed, total: data.total });
      setAllPassed(data.allPassed === true);
    } catch (e: unknown) {
      console.error('Test run failed:', e);
    } finally {
      setTesting(false);
    }
  };

  // ── Enable ──────────────────────────────────────────────────────────────────

  const handleEnable = async () => {
    if (!generatedSpec) return;
    setEnabling(true);
    setEnableError('');
    try {
      const res = await fetch('/api/admin/factory/enable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: generatedSpec.slug, enabled: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enable failed');
      await loadCalculators();
      setView('done');
    } catch (e: unknown) {
      setEnableError(e instanceof Error ? e.message : 'Enable failed');
    } finally {
      setEnabling(false);
    }
  };

  // ── Toggle status ───────────────────────────────────────────────────────────

  const handleToggleStatus = async (slug: string, currentStatus: string) => {
    const enabled = currentStatus !== 'active';
    try {
      const res = await fetch('/api/admin/factory/enable', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, enabled }),
      });
      if (res.ok) await loadCalculators();
    } catch { /* silent */ }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (slug: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/factory/save?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
      if (res.ok) setCalculators((prev) => prev.filter((c) => c.slug !== slug));
    } finally {
      setDeleting(false);
      setDeleteSlug('');
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────

  const resetWorkflow = () => {
    setView('list');
    setSelectedOpp(null);
    setOpportunities([]);
    setResearchQuery('');
    setResearchError('');
    setGenError('');
    setGeneratedSpec(null);
    setTestResults([]);
    setAllPassed(false);
    setEnableError('');
  };

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = {
    total: calculators.length,
    active: calculators.filter((c) => c.status === 'active').length,
    inactive: calculators.filter((c) => c.status === 'inactive').length,
    testsPassed: calculators.filter((c) => c.metadata.testStatus === 'passed').length,
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">AI Calculator Factory</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Research trending calculator ideas, generate complete implementations, run tests, and publish.
          </p>
        </div>
        {view === 'list' ? (
          <button
            onClick={() => { setView('research'); setResearchError(''); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            New Calculator
          </button>
        ) : (
          <button
            onClick={resetWorkflow}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
          >
            <X className="w-3.5 h-3.5" />
            Back to List
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: LIST
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'list' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: <Calculator className="w-4 h-4" /> },
              { label: 'Active', value: stats.active, icon: <Activity className="w-4 h-4" /> },
              { label: 'Inactive', value: stats.inactive, icon: <ToggleLeft className="w-4 h-4" /> },
              { label: 'Tests Passing', value: stats.testsPassed, icon: <CheckCircle className="w-4 h-4" /> },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{s.label}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)]" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                    {s.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
              <p className="text-sm font-semibold text-[var(--text-primary)]">AI-Generated Calculators</p>
              <button onClick={loadCalculators} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingList ? (
              <div className="flex items-center justify-center py-16 text-[var(--text-muted)] text-sm">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
              </div>
            ) : listError ? (
              <div className="flex items-center justify-center py-16 text-red-400 text-sm gap-2">
                <AlertCircle className="w-4 h-4" /> {listError}
              </div>
            ) : calculators.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Zap className="w-10 h-10 text-[var(--text-muted)] opacity-40" />
                <p className="text-sm text-[var(--text-muted)]">No calculators yet. Click &quot;New Calculator&quot; to generate your first one.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
                      {['Name', 'Slug', 'Status', 'Tests', 'Created', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calculators.map((calc) => (
                      <tr key={calc.id} className="hover:bg-[var(--bg-card-hover)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-[var(--text-primary)]">{calc.name}</div>
                          <div className="text-xs text-[var(--text-muted)] capitalize mt-0.5">{calc.category}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-[var(--text-muted)]">{calc.slug}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge status={calc.status} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <TestBadge status={calc.metadata.testStatus} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--text-muted)]">
                          {formatDate(calc.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {calc.status === 'active' && (
                              <a
                                href={`/${calc.slug}-calculator`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-600/10 transition"
                                title="View live"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleToggleStatus(calc.slug, calc.status)}
                              disabled={calc.status === 'inactive' && calc.metadata.testStatus !== 'passed'}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-400 hover:bg-emerald-600/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                              title={calc.status === 'active' ? 'Deactivate' : calc.metadata.testStatus !== 'passed' ? 'Must pass tests first' : 'Activate'}
                            >
                              {calc.status === 'active' ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setDeleteSlug(calc.slug)}
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

          {/* Delete confirmation */}
          {deleteSlug && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="rounded-2xl border p-6 w-full max-w-sm space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-[var(--text-primary)]">Delete Calculator?</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  This will permanently delete <span className="font-mono font-bold text-[var(--text-primary)]">{deleteSlug}</span>. This cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setDeleteSlug('')} className="px-4 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition">Cancel</button>
                  <button onClick={() => handleDelete(deleteSlug)} disabled={deleting} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50">
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: RESEARCH
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'research' && (
        <div className="space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="text-blue-400 font-medium">1. Research</span>
            <ChevronRight className="w-3 h-3" />
            <span>2. Configure</span>
            <ChevronRight className="w-3 h-3" />
            <span>3. Generate</span>
            <ChevronRight className="w-3 h-3" />
            <span>4. Test & Publish</span>
          </div>

          {/* Search */}
          <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Find Trending Calculator Ideas</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Enter a topic or niche. Live search demand data is retrieved and scored by AI.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  value={researchQuery}
                  onChange={(e) => setResearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                  placeholder="e.g. compound interest, retirement, calories, taxes…"
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
                {researching ? 'Searching…' : 'Find Ideas'}
              </button>
            </div>
            {researchError && (
              <p className="mt-3 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {researchError}
              </p>
            )}
          </div>

          {/* Opportunities table */}
          {opportunities.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{opportunities.length} Calculator Opportunities</p>
                <span className="text-xs text-[var(--text-muted)]">Click a row to build it</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
                      {['Calculator Idea', 'Search Volume', 'Competition', 'Trend', 'Opportunity', 'Est. Traffic', ''].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">{h}</th>
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
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="font-medium text-[var(--text-primary)]">{opp.calculatorName || opp.keyword}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed max-w-[240px] line-clamp-2">{opp.rationale}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-semibold text-[var(--text-primary)]">{opp.searchVolume}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <CompBadge level={opp.competition} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <TrendIcon trend={opp.trend} />
                            <span className="text-xs capitalize text-[var(--text-muted)]">{opp.trend}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 min-w-[140px]">
                          {scoreBar(opp.opportunityScore)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-xs font-semibold text-emerald-400">{opp.estimatedTraffic}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition whitespace-nowrap">
                            Build →
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
            <button onClick={() => setView('research')} className="text-blue-400 font-medium hover:underline">1. Research</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-400 font-medium">2. Configure</span>
            <ChevronRight className="w-3 h-3" />
            <span>3. Generate</span>
            <ChevronRight className="w-3 h-3" />
            <span>4. Test & Publish</span>
          </div>

          {/* Selected opportunity summary */}
          <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">Selected Opportunity</p>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedOpp.calculatorName || selectedOpp.keyword}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-lg">{selectedOpp.description}</p>
              </div>
              <div className="shrink-0 grid grid-cols-2 gap-x-6 gap-y-1.5 text-right">
                <span className="text-xs text-[var(--text-muted)]">Volume</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{selectedOpp.searchVolume}</span>
                <span className="text-xs text-[var(--text-muted)]">Competition</span>
                <CompBadge level={selectedOpp.competition} />
                <span className="text-xs text-[var(--text-muted)]">Trend</span>
                <div className="flex items-center gap-1 justify-end"><TrendIcon trend={selectedOpp.trend} /><span className="text-xs capitalize text-[var(--text-muted)]">{selectedOpp.trend}</span></div>
                <span className="text-xs text-[var(--text-muted)]">Est. Traffic</span>
                <span className="text-xs font-bold text-emerald-400">{selectedOpp.estimatedTraffic}</span>
              </div>
            </div>
          </div>

          {/* Configure form */}
          <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Configure</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Calculator Name</label>
                <input
                  value={calcName}
                  onChange={(e) => { setCalcName(e.target.value); setCalcSlug(slugify(e.target.value)); }}
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-transparent text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">URL Slug (auto-generated)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--text-muted)]">/{calcSlug}-calculator</span>
                </div>
                <input
                  value={calcSlug}
                  onChange={(e) => setCalcSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border bg-transparent font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            {genError && (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {genError}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleGenerate}
                disabled={!calcName.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Generate Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: GENERATING
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'generating' && (
        <div className="rounded-xl border p-10 flex flex-col items-center gap-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center">
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-base font-bold text-[var(--text-primary)]">Generating <span className="text-blue-400">{calcName}</span></p>
            <p className="text-sm text-[var(--text-muted)] animate-pulse">{genStage}</p>
          </div>
          <div className="w-full max-w-xs space-y-3 text-xs text-[var(--text-muted)]">
            {[
              'Formula & calculation engine',
              'Inputs, outputs & examples',
              'FAQ, How-To & SEO content',
              'Unit, edge & formula tests',
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: REVIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'review' && generatedSpec && (
        <div className="space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>1. Research</span>
            <ChevronRight className="w-3 h-3" />
            <span>2. Configure</span>
            <ChevronRight className="w-3 h-3" />
            <span>3. Generate</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-400 font-medium">4. Test & Publish</span>
          </div>

          {/* Spec summary */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">Generated: {generatedSpec.name}</p>
              <span className="ml-auto text-xs capitalize text-[var(--text-muted)]">{generatedSpec.category}</span>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Inputs', value: generatedSpec.inputs?.length ?? 0 },
                { label: 'Outputs', value: generatedSpec.outputs?.length ?? 0 },
                { label: 'FAQ Items', value: generatedSpec.faqItems?.length ?? 0 },
                { label: 'Tests', value: generatedSpec.tests?.length ?? 0 },
              ].map((m) => (
                <div key={m.label} className="rounded-lg p-3 text-center border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                  <p className="text-xl font-black text-blue-400">{m.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
            {generatedSpec.formula && (
              <div className="px-5 pb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Formula</p>
                <div className="rounded-lg px-4 py-3 font-mono text-sm" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderLeft: '3px solid var(--border-focus)' }}>
                  {generatedSpec.formula.expression}
                </div>
              </div>
            )}
          </div>

          {/* Test results */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card-hover)' }}>
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[var(--text-muted)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">Test Suite</p>
              </div>
              {!testing && testResults.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-semibold">{testSummary.passed} passed</span>
                  {testSummary.failed > 0 && <span className="text-xs text-red-400 font-semibold">{testSummary.failed} failed</span>}
                  <button
                    onClick={() => runTests(generatedSpec)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                    title="Re-run tests"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {testing ? (
              <div className="flex items-center justify-center py-10 text-[var(--text-muted)] text-sm gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Running {generatedSpec.tests?.length} tests…
              </div>
            ) : testResults.length === 0 && (!generatedSpec.tests || generatedSpec.tests.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-[var(--text-muted)]">
                <AlertCircle className="w-8 h-8 opacity-40" />
                <p className="text-sm">No tests were generated for this calculator.</p>
              </div>
            ) : testResults.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <button onClick={() => runTests(generatedSpec)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" /> Run Tests
                </button>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {/* Summary bar */}
                <div className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${testSummary.total > 0 ? (testSummary.passed / testSummary.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--text-muted)] whitespace-nowrap">
                    {testSummary.passed}/{testSummary.total}
                  </span>
                </div>
                {testResults.map((r, i) => (
                  <div key={i} className="px-5 py-3 flex items-start gap-3" style={{ borderColor: 'var(--border)' }}>
                    {r.passed
                      ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{r.name}</span>
                        <TypeBadge type={r.type} />
                      </div>
                      {!r.passed && r.error && (
                        <p className="text-xs text-red-400 mt-1 font-mono">{r.error}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enable / error */}
          {enableError && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {enableError}
            </p>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('configure')}
              className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
            >
              ← Reconfigure
            </button>
            <button
              onClick={handleEnable}
              disabled={enabling || !allPassed || testResults.length === 0}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
              title={!allPassed ? 'All tests must pass before publishing' : ''}
            >
              {enabling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {enabling ? 'Publishing…' : allPassed ? 'Enable & Publish' : `Fix ${testSummary.failed} Failing Test${testSummary.failed !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW: DONE
      ═══════════════════════════════════════════════════════════════════════ */}
      {view === 'done' && generatedSpec && (
        <div className="rounded-xl border p-10 flex flex-col items-center gap-5 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{generatedSpec.name} is live!</h3>
            <p className="text-sm text-[var(--text-muted)]">All tests passed. The calculator is now published on your website.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/${generatedSpec.slug}-calculator`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <Eye className="w-4 h-4" /> View Calculator
            </a>
            <button
              onClick={resetWorkflow}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
              style={{ borderColor: 'var(--border)' }}
            >
              Back to List
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
