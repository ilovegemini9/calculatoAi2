'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { calculate } from '@/config/calculator-engine';
import { formatNumber } from '@/lib/utils';
import type { CalculatorInput, CalculatorOutput } from '@/lib/types';

interface Props {
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  calculatorId: string;
}

type InputValue = string | number;

function toEngineValue(input: CalculatorInput, raw: string): InputValue | number[] {
  if (input.type === 'number') {
    if (raw.trim() === '') throw new Error(`${input.label} is required`);
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error(`${input.label} must be a valid number`);
    if (input.min !== undefined && value < input.min) throw new Error(`${input.label} must be at least ${input.min}`);
    if (input.max !== undefined && value > input.max) throw new Error(`${input.label} must be at most ${input.max}`);
    return value;
  }

  if ((input.name === 'values' || input.name === 'weights') && input.type === 'text') {
    const values = raw.split(/[,\s]+/).filter(Boolean).map(Number);
    if (!values.length || values.some((value) => !Number.isFinite(value))) {
      throw new Error(`${input.label} must contain valid numbers separated by commas or spaces`);
    }
    return values;
  }

  if (raw.trim() === '') throw new Error(`${input.label} is required`);
  return raw;
}

export function DynamicCalculator({ inputs, outputs, calculatorId }: Props) {
  const uid = useId();
  const safeInputs = useMemo(() => (Array.isArray(inputs) ? inputs : []), [inputs]);
  const safeOutputs = useMemo(() => (Array.isArray(outputs) ? outputs : []), [outputs]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const input of safeInputs) initial[input.name] = String(input.defaultValue ?? '');
    setValues(initial);
  }, [safeInputs]);

  useEffect(() => {
    if (!safeInputs.length || !Object.keys(values).length) return;

    try {
      const engineInputs: Record<string, string | number | number[]> = {};
      for (const input of safeInputs) engineInputs[input.name] = toEngineValue(input, values[input.name] ?? '');
      const calculated = calculate(calculatorId, engineInputs);
      setResults(calculated);
      setError('');
    } catch (err: unknown) {
      setResults({});
      setError(err instanceof Error ? err.message : 'Unable to calculate with the verified formula.');
    }
  }, [calculatorId, safeInputs, values]);

  const handleChange = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));

  const reset = () => {
    const initial: Record<string, string> = {};
    for (const input of safeInputs) initial[input.name] = String(input.defaultValue ?? '');
    setValues(initial);
  };

  const formatResult = (value: unknown): string => {
    if (Array.isArray(value)) return value.map((item) => typeof item === 'number' ? formatNumber(item) : String(item)).join(', ');
    if (typeof value === 'number') return Number.isFinite(value) ? formatNumber(value) : '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value == null ? '—' : String(value);
  };

  const inputCount = safeInputs.length;
  const completedCount = safeInputs.filter((input) => (values[input.name] ?? '').trim() !== '').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <section
        className="md:col-span-7 rounded-2xl border p-5 sm:p-6 space-y-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">Your inputs</h2>
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter the values that describe your situation. Every field below is connected to the verified calculation formula.
            </p>
          </div>
          <button type="button" onClick={reset} className="shrink-0 rounded-lg border px-3 py-2 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Reset
          </button>
        </div>

        <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
          <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            <span>Input progress</span><span>{completedCount}/{inputCount} filled</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--border)' }}>
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${inputCount ? (completedCount / inputCount) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="space-y-4">
          {safeInputs.map((input, index) => {
            const inputId = `${uid}-${input.name}`;
            const helpId = input.helpText ? `${inputId}-help` : undefined;
            const current = values[input.name] ?? String(input.defaultValue ?? '');
            const isNumber = input.type === 'number';
            const constraints = [
              input.min !== undefined ? `Min ${input.min}` : '',
              input.max !== undefined ? `Max ${input.max}` : '',
              input.step !== undefined ? `Step ${input.step}` : '',
            ].filter(Boolean);

            return (
              <div key={input.name} className="rounded-xl border p-4 sm:p-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-black text-blue-500" aria-hidden="true">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={inputId} className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {input.label} <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    {input.helpText && <p id={helpId} className="mt-1.5 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>{input.helpText}</p>}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    {isNumber && input.suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{input.suffix}</span>}
                    {input.type === 'select' ? (
                      <select
                        id={inputId}
                        value={current}
                        aria-describedby={helpId}
                        onChange={(event) => handleChange(input.name, event.target.value)}
                        className="w-full min-h-[48px] px-3 border rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        {(input.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        type={input.type === 'number' ? 'number' : input.type === 'date' ? 'date' : 'text'}
                        min={input.min}
                        max={input.max}
                        step={input.step}
                        inputMode={input.type === 'number' ? 'decimal' : undefined}
                        value={current}
                        aria-describedby={helpId}
                        onChange={(event) => handleChange(input.name, event.target.value)}
                        className={`w-full min-h-[48px] px-3 ${isNumber && input.suffix ? 'pr-14' : ''} border rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  {input.defaultValue !== undefined && <span>Default: {String(input.defaultValue)}{input.suffix ? ` ${input.suffix}` : ''}</span>}
                  {constraints.map((constraint) => <span key={constraint}>{constraint}</span>)}
                  {input.type === 'text' && (input.name === 'values' || input.name === 'weights') && <span>Use commas or spaces between numbers</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="md:col-span-5 space-y-6">
        <div
          className="rounded-2xl border p-5 sm:p-6 space-y-5"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          aria-live="polite"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
              <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">Calculated results</h2>
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Results update instantly from the verified engine.</p>
          </div>

          {error ? (
            <div role="alert" className="rounded-xl border p-4 text-sm leading-6" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Check your inputs.</strong><br />{error}
            </div>
          ) : safeOutputs.length ? (
            <div className="space-y-3">
              {safeOutputs.map((output) => (
                <div key={output.name} className={`rounded-xl border p-4 ${output.highlight ? 'ring-2 ring-blue-500/20' : ''}`} style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{output.label}</div>
                  <div className="mt-1 text-2xl font-black font-mono break-words" style={{ color: 'var(--text-primary)' }}>
                    {formatResult(results[output.name])}{output.suffix ? ` ${output.suffix}` : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>No result fields are configured for this calculator.</p>
          )}
        </div>

        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Calculation integrity</h3>
          <p className="text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
            This calculator runs only a registered formula from the verified engine. Missing, invalid, or out-of-range values stop the calculation instead of producing a plausible-looking guess.
          </p>
        </div>
      </section>
    </div>
  );
}
