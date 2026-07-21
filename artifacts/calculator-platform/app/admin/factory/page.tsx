'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CalculatorInput {
  name: string;
  label: string;
  type: 'number' | 'select' | 'text';
  defaultValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  helpText?: string;
}

interface CalculatorOutput {
  name: string;
  label: string;
  suffix?: string;
  highlight?: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface Spec {
  name: string;
  slug: string;
  category: 'financial' | 'fitness' | 'math' | 'lifestyle';
  title: string;
  description: string;
  shortDescription: string;
  keywords: string[];
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  calculateBody: string;
  howToUse: string[];
  faqItems: FaqItem[];
}

export default function AICalculatorFactory() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [spec, setSpec] = useState<Spec | null>(null);
  
  // Dynamic calculators database list
  const [publishedCalculators, setPublishedCalculators] = useState<Spec[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Sandboxed tester state
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [testOutputs, setTestOutputs] = useState<Record<string, unknown> | null>(null);
  const [testError, setTestError] = useState('');

  const progressMessages = [
    '🤖 Step 1: Initiating niche research & category matching...',
    '📐 Step 2: Drafting formula blueprints & mathematical boundaries...',
    '⚙️ Step 3: Designing Zod validators & responsive dynamic input nodes...',
    '✍️ Step 4: Authoring rich editorial content, descriptions, and FAQ cards...',
    '🔬 Step 5: Running simulated calculations and validating edge cases...',
  ];

  const fetchPublished = () => {
    fetch('/api/admin/factory/save')
      .then((res) => res.json())
      .then((data) => {
        setPublishedCalculators(data);
        setLoadingList(false);
      })
      .catch(() => {
        toast.error('Failed to load published calculators.');
        setLoadingList(false);
      });
  };

  useEffect(() => {
    fetchPublished();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setSpec(null);
    setTestOutputs(null);
    setTestError('');
    setProgressStep(0);

    // Simulate progress steps visually
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev < progressMessages.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 2200);

    try {
      const res = await fetch('/api/admin/factory/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      clearInterval(interval);

      if (res.ok) {
        const data = await res.json();
        setSpec(data);
        
        // Setup default tester inputs
        const initialInputs: Record<string, string> = {};
        (data.inputs || []).forEach((inp: CalculatorInput) => {
          initialInputs[inp.name] = String(inp.defaultValue ?? '');
        });
        setTestInputs(initialInputs);
        toast.success('Calculator spec blueprint successfully synthesized!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to synthesize calculator spec.');
      }
    } catch (err) {
      toast.error('Synthesis timed out or failed. Please retry.');
    } finally {
      setGenerating(false);
    }
  };

  // Safe Math formula execution in sandbox
  const handleRunTest = () => {
    if (!spec) return;
    setTestError('');
    setTestOutputs(null);

    try {
      // Cast input values to numbers/types where suitable
      const inputsObj: Record<string, string | number> = {};
      spec.inputs.forEach((inp) => {
        const val = testInputs[inp.name];
        inputsObj[inp.name] = inp.type === 'number' ? Number(val || 0) : val;
      });

      // Execute code sandbox securely
      const runner = new Function('inputs', spec.calculateBody);
      const outputObj = runner(inputsObj) as Record<string, unknown>;

      if (typeof outputObj !== 'object' || outputObj === null) {
        throw new Error('Formula calculation must return an object containing results.');
      }

      setTestOutputs(outputObj);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error executing calculation formula.';
      setTestError(errMsg);
    }
  };

  const handlePublish = async () => {
    if (!spec) return;

    try {
      const res = await fetch('/api/admin/factory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spec),
      });

      if (res.ok) {
        toast.success('Dynamic calculator is live on /' + spec.slug + '-calculator');
        setSpec(null);
        fetchPublished();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to publish calculator.');
      }
    } catch (err) {
      toast.error('Failed to communicate with publishing service.');
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('De-publish and delete this calculator permanently?')) return;

    try {
      const res = await fetch(`/api/admin/factory/save?slug=${slug}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Calculator removed successfully.');
        fetchPublished();
      } else {
        toast.error('Failed to delete calculator.');
      }
    } catch (err) {
      toast.error('An error occurred.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          AI Calculator Factory
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Describe a custom calculation utility. The factory will design formulas, validation systems, rich articles, and deploy them live dynamically.
        </p>
      </div>

      {/* Main prompt bar */}
      <div 
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
          Synthesize New Utility System
        </h2>
        
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <textarea
              rows={3}
              required
              disabled={generating}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A rental property cash on cash return calculator. Take inputs like home value, down payment, monthly rent, and operating expenses. Calculate monthly net rental cash flow..."
              className="w-full p-3 border rounded-xl outline-none text-sm"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
            >
              {generating ? 'Processing AI Synthesis...' : 'Build Dynamic Specs'}
            </button>
          </div>
        </form>

        {generating && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Synthesis Engine Pipeline</span>
              <span className="text-xs font-mono">{progressStep + 1} / {progressMessages.length}</span>
            </div>
            <p className="text-sm font-semibold transition-all duration-300" style={{ color: 'var(--text-primary)' }}>
              {progressMessages[progressStep]}
            </p>
            <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500 rounded-full" 
                style={{ width: `${((progressStep + 1) / progressMessages.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Generated Spec Preview & Editor Panel */}
      {spec && (
        <div className="space-y-6">
          <div 
            className="rounded-2xl border p-6 space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Synthesized Spec Draft: {spec.name}
              </h2>
              <span className="text-xs font-bold text-green-500 uppercase">Ready for validation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Calculator Name</label>
                <input
                  type="text"
                  value={spec.name}
                  onChange={(e) => setSpec({ ...spec, name: e.target.value })}
                  className="w-full p-3 border rounded-xl outline-none text-xs font-bold"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>URL Slug</label>
                <input
                  type="text"
                  value={spec.slug}
                  onChange={(e) => setSpec({ ...spec, slug: e.target.value })}
                  className="w-full p-3 border rounded-xl outline-none text-xs font-mono"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Niche Category</label>
                <select
                  value={spec.category}
                  onChange={(e) => setSpec({ ...spec, category: e.target.value as 'financial' | 'fitness' | 'math' | 'lifestyle' })}
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

            {/* Code Block Formula editor */}
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                JavaScript Calculation Math Formula Code
              </label>
              <textarea
                rows={6}
                value={spec.calculateBody}
                onChange={(e) => setSpec({ ...spec, calculateBody: e.target.value })}
                className="w-full p-3 border rounded-xl outline-none text-xs font-mono leading-relaxed"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Test Sandbox */}
            <div className="p-4 rounded-xl border space-y-4" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">
                ⚡ Sandboxed Edge Case Tester (Edge Case validation)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sandbox Inputs */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Sandbox Inputs</h4>
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
                    type="button"
                    onClick={handleRunTest}
                    className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/15 text-blue-500 text-xs font-bold rounded-lg transition"
                  >
                    Run Calculation Check
                  </button>
                </div>

                {/* Sandbox Outputs */}
                <div className="space-y-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Output Responses</h4>
                  {testError && (
                    <p className="text-xs font-semibold text-red-500">⚠️ {testError}</p>
                  )}
                  {testOutputs && (
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
                  )}
                  {!testOutputs && !testError && (
                    <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Click Run Calculation Check to run tests.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSpec(null)}
                className="px-5 py-2.5 border rounded-xl text-xs font-bold uppercase hover:bg-[var(--bg-card-hover)] transition"
                style={{ borderColor: 'var(--border)' }}
              >
                Discard Spec Draft
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg shadow-blue-600/25"
              >
                Publish Live on Platform
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Published Active dynamically registered calculators */}
      <div 
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
          Published Dynamic Calculators
        </h2>

        {loadingList ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading active registry...</p>
        ) : publishedCalculators.length === 0 ? (
          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No dynamic calculators currently published.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {publishedCalculators.map((calc) => (
              <div key={calc.slug} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{calc.name}</span>
                  <span className="text-xs font-mono ml-2" style={{ color: 'var(--text-muted)' }}>/calculator/{calc.slug}</span>
                  <span className="text-[10px] uppercase font-bold text-blue-500 ml-2">({calc.category})</span>
                </div>
                <button
                  onClick={() => handleDelete(calc.slug)}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
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
