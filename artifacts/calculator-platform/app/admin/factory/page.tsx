'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface CalculatorInput {
  name: string; label: string; type: 'number' | 'select' | 'text';
  defaultValue?: number | string; min?: number; max?: number; step?: number; suffix?: string; helpText?: string;
}
interface CalculatorOutput { name: string; label: string; suffix?: string; highlight?: boolean; }
interface FaqItem { question: string; answer: string; }
interface Spec {
  name: string; slug: string; category: 'financial' | 'fitness' | 'math' | 'lifestyle';
  title: string; description: string; shortDescription: string; keywords: string[];
  inputs: CalculatorInput[]; outputs: CalculatorOutput[];
  calculateBody: string; howToUse: string[]; faqItems: FaqItem[];
}
interface AiStats {
  connected: boolean; aiEnabled: boolean; provider: string | null;
  stats: { totalGenerated: number; published: number; pendingApproval: number; failed: number; generatedThisWeek: number; };
}

const PROGRESS_STEPS = [
  '🤖 Step 1: Niche research & category matching…',
  '📐 Step 2: Drafting formula blueprints & mathematical boundaries…',
  '⚙️  Step 3: Designing input nodes & validation schema…',
  '✍️  Step 4: Authoring rich editorial content & FAQ cards…',
  '🔬 Step 5: Validating edge cases & finalising spec…',
];

export default function AICalculatorFactory() {
  const searchParams = useSearchParams();
  const [prompt, setPrompt]           = useState(() => searchParams.get('prompt') ?? '');
  const [generating, setGenerating]   = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [spec, setSpec]               = useState<Spec | null>(null);

  const [publishedCalculators, setPublishedCalculators] = useState<Spec[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [testInputs, setTestInputs]   = useState<Record<string, string>>({});
  const [testOutputs, setTestOutputs] = useState<Record<string, unknown> | null>(null);
  const [testError, setTestError]     = useState('');

  // AI stats from DB
  const [aiStats, setAiStats]         = useState<AiStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchPublished = () => {
    setLoadingList(true);
    fetch('/api/admin/factory/save')
      .then((r) => r.json())
      .then((data) => { setPublishedCalculators(data); setLoadingList(false); })
      .catch(() => { toast.error('Failed to load published calculators.'); setLoadingList(false); });
  };

  useEffect(() => {
    fetchPublished();
    fetch('/api/admin/ai-usage')
      .then((r) => r.json())
      .then((d) => { setAiStats(d); setStatsLoading(false); })
      .catch(() => setStatsLoading(false));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setGenerating(true); setSpec(null); setTestOutputs(null); setTestError(''); setProgressStep(0);

    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev < PROGRESS_STEPS.length - 1) return prev + 1;
        clearInterval(interval); return prev;
      });
    }, 2200);

    try {
      const res = await fetch('/api/admin/factory/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      clearInterval(interval);
      if (res.ok) {
        const data = await res.json();
        setSpec(data);
        const initial: Record<string, string> = {};
        (data.inputs || []).forEach((inp: CalculatorInput) => { initial[inp.name] = String(inp.defaultValue ?? ''); });
        setTestInputs(initial);
        toast.success('Calculator spec synthesised successfully!');
        // Refresh stats
        fetch('/api/admin/ai-usage').then((r) => r.json()).then(setAiStats).catch(() => null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to synthesise calculator spec.');
      }
    } catch { toast.error('Synthesis timed out or failed. Please retry.'); }
    finally { setGenerating(false); }
  };

  const handleRunTest = () => {
    if (!spec) return;
    setTestError(''); setTestOutputs(null);
    try {
      const inputsObj: Record<string, string | number> = {};
      spec.inputs.forEach((inp) => {
        const val = testInputs[inp.name];
        inputsObj[inp.name] = inp.type === 'number' ? Number(val || 0) : val;
      });
      const runner = new Function('inputs', spec.calculateBody);
      const outputObj = runner(inputsObj) as Record<string, unknown>;
      if (typeof outputObj !== 'object' || outputObj === null) throw new Error('Formula must return an object.');
      setTestOutputs(outputObj);
    } catch (err: unknown) {
      setTestError(err instanceof Error ? err.message : 'Error executing formula.');
    }
  };

  const handlePublish = async () => {
    if (!spec) return;
    try {
      const res = await fetch('/api/admin/factory/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spec),
      });
      if (res.ok) {
        toast.success(`Live at /${spec.slug}-calculator`);
        setSpec(null);
        fetchPublished();
        fetch('/api/admin/ai-usage').then((r) => r.json()).then(setAiStats).catch(() => null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to publish calculator.');
      }
    } catch { toast.error('Failed to communicate with publishing service.'); }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('De-publish and delete this calculator permanently?')) return;
    try {
      const res = await fetch(`/api/admin/factory/save?slug=${slug}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Calculator removed.'); fetchPublished(); }
      else toast.error('Failed to delete calculator.');
    } catch { toast.error('An error occurred.'); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          AI Calculator Factory
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Describe a utility. The engine designs formulas, validation, rich articles, and deploys live — dynamically.
        </p>
      </div>

      {/* ── AI stats — real data from DB ───────────────────────────────────── */}
      {statsLoading ? (
        <div className="py-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>Loading AI engine stats…</div>
      ) : aiStats && (
        <div className="space-y-3">
          {/* Provider status */}
          {aiStats.connected && aiStats.aiEnabled ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-bold text-green-500">{aiStats.provider} connected</span>
              <span style={{ color: 'var(--text-muted)' }}>· AI features enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-bold text-red-500">
                {!aiStats.aiEnabled ? 'AI features disabled' : 'No AI provider connected'}
              </span>
              <a href="/admin/settings" className="text-blue-500 hover:underline font-bold">Configure in Settings →</a>
            </div>
          )}

          {/* Stats strip — queried from DB */}
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Factory stats — queried from calculators table
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Generated',    value: aiStats.stats.totalGenerated,    color: 'text-blue-500'   },
              { label: 'Published (Live)',   value: aiStats.stats.published,         color: 'text-green-500'  },
              { label: 'Pending Approval',   value: aiStats.stats.pendingApproval,   color: 'text-yellow-500' },
              { label: 'Factory Errors',     value: aiStats.stats.failed,            color: aiStats.stats.failed > 0 ? 'text-red-500' : 'text-green-500' },
              { label: 'Generated This Week', value: aiStats.stats.generatedThisWeek, color: 'text-purple-500' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Prompt bar ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">Synthesise New Utility</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <textarea
            rows={3} required disabled={generating} value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A rental property cash-on-cash return calculator. Inputs: home value, down payment, monthly rent, operating expenses. Outputs: monthly net cash flow, annual yield…"
            className="w-full p-3 border rounded-xl outline-none text-sm"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <div className="flex justify-end">
            <button
              type="submit" disabled={generating}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
            >
              {generating ? 'Processing AI Synthesis…' : 'Build Dynamic Specs'}
            </button>
          </div>
        </form>

        {generating && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Synthesis Engine Pipeline</span>
              <span className="text-xs font-mono">{progressStep + 1} / {PROGRESS_STEPS.length}</span>
            </div>
            <p className="text-sm font-semibold transition-all duration-300" style={{ color: 'var(--text-primary)' }}>
              {PROGRESS_STEPS[progressStep]}
            </p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Generated spec preview ─────────────────────────────────────────── */}
      {spec && (
        <div className="space-y-6">
          <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Synthesised Spec: {spec.name}
              </h2>
              <span className="text-xs font-bold text-green-500 uppercase">Ready for validation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Calculator Name', key: 'name' as const, mono: false },
                { label: 'URL Slug',        key: 'slug' as const, mono: true  },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                  <input
                    type="text" value={spec[f.key]}
                    onChange={(e) => setSpec({ ...spec, [f.key]: e.target.value })}
                    className={`w-full p-3 border rounded-xl outline-none text-xs ${f.mono ? 'font-mono' : 'font-bold'}`}
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                <select
                  value={spec.category} onChange={(e) => setSpec({ ...spec, category: e.target.value as Spec['category'] })}
                  className="w-full p-3 border rounded-xl outline-none text-xs cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="financial">Financial</option>
                  <option value="fitness">Fitness & Health</option>
                  <option value="math">Math</option>
                  <option value="lifestyle">Lifestyle</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                JavaScript Calculation Formula
              </label>
              <textarea
                rows={6} value={spec.calculateBody}
                onChange={(e) => setSpec({ ...spec, calculateBody: e.target.value })}
                className="w-full p-3 border rounded-xl outline-none text-xs font-mono leading-relaxed"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Sandbox tester */}
            <div className="p-4 rounded-xl border space-y-4" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">⚡ Sandboxed Edge-Case Tester</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Inputs</h4>
                  {spec.inputs.map((inp) => (
                    <div key={inp.name} className="flex items-center justify-between gap-2">
                      <label className="text-xs font-medium shrink-0" style={{ color: 'var(--text-secondary)' }}>{inp.label}</label>
                      <input
                        type={inp.type === 'number' ? 'number' : 'text'}
                        value={testInputs[inp.name] || ''}
                        onChange={(e) => setTestInputs({ ...testInputs, [inp.name]: e.target.value })}
                        className="p-1.5 border rounded-lg text-xs w-28 text-right outline-none"
                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  ))}
                  <button
                    type="button" onClick={handleRunTest}
                    className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/15 text-blue-500 text-xs font-bold rounded-lg transition"
                  >
                    Run Calculation Check
                  </button>
                </div>
                <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Outputs</h4>
                  {testError && <p className="text-xs font-semibold text-red-500">⚠️ {testError}</p>}
                  {testOutputs ? (
                    <div className="space-y-2">
                      {spec.outputs.map((out) => (
                        <div key={out.name} className="flex justify-between items-center text-xs">
                          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{out.label}:</span>
                          <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                            {testOutputs[out.name] !== undefined ? String(testOutputs[out.name]) : 'N/A'} {out.suffix}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : !testError && (
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Click Run Calculation Check to validate.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button" onClick={() => setSpec(null)}
                className="px-5 py-2.5 border rounded-xl text-xs font-bold uppercase hover:bg-[var(--bg-card-hover)] transition"
                style={{ borderColor: 'var(--border)' }}
              >
                Discard Draft
              </button>
              <button
                type="button" onClick={handlePublish}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-blue-600/25"
              >
                Publish Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Published dynamic calculators — from DB ────────────────────────── */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
          Published Dynamic Calculators — queried from calculators table
        </h2>
        {loadingList ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading active registry…</p>
        ) : publishedCalculators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-3xl">⚡</span>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No dynamic calculators published yet</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Describe a calculator above to synthesise and publish your first one.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {publishedCalculators.map((calc) => (
              <div key={calc.slug} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{calc.name}</span>
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-muted)' }}>/{calc.slug}-calculator</span>
                  <span className="text-[10px] uppercase font-bold text-blue-500 ml-2">({calc.category})</span>
                </div>
                <button onClick={() => handleDelete(calc.slug)} className="text-xs font-bold text-red-500 hover:underline">
                  Unpublish
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
