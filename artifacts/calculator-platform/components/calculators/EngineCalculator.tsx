'use client';

import { useMemo, useState } from 'react';
import { calculate, getCalculatorSpec } from '@/config/calculator-engine';
import { Field, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

export function EngineCalculator({ slug }: { slug: string }) {
  const spec = useMemo(() => {
    try { return getCalculatorSpec(slug); } catch { return null; }
  }, [slug]);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  if (!spec) return <div className="p-6 text-center text-slate-500">Calculator is not available yet.</div>;

  const run = () => {
    try {
      const inputs: Record<string, number | string | number[]> = {};
      for (const key of spec.inputs) {
        const value = raw[key] ?? '';
        if (key === 'values' || key === 'weights') {
          inputs[key] = value.split(/[,\s]+/).filter(Boolean).map(Number);
        } else {
          const numeric = Number(value);
          inputs[key] = value.trim() !== '' && Number.isFinite(numeric) ? numeric : value;
        }
      }
      setResult(calculate(slug, inputs));
      setError('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Enter valid inputs.');
    }
  };

  return (
    <div className="space-y-6">
      <InputsPanel>
        <div className="grid gap-4 sm:grid-cols-2">
          {spec.inputs.map((key) => (
            <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}>
              <input
                className="w-full rounded-xl border px-3 py-2.5 bg-transparent"
                inputMode={key === 'values' || key === 'weights' ? 'text' : 'decimal'}
                placeholder={key === 'values' || key === 'weights' ? 'e.g. 10, 20, 30' : 'Enter value'}
                value={raw[key] ?? ''}
                onChange={(e) => setRaw((p) => ({ ...p, [key]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
        <button type="button" onClick={run} className="mt-5 rounded-xl px-5 py-3 font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Calculate</button>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </InputsPanel>
      {result && (
        <ResultsPanel title="Results">
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(result).map(([key, value]) => (
              <ResultCard key={key} label={key.replace(/([A-Z])/g, ' $1')} value={typeof value === 'number' ? value : String(value)} />
            ))}
          </div>
        </ResultsPanel>
      )}
      <p className="text-xs text-slate-500">Formula: {spec.formula}</p>
    </div>
  );
}
