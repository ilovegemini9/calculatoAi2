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

  // Some verified statistical handlers accept a numeric array under `values`/`weights`.
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
      for (const input of safeInputs) {
        engineInputs[input.name] = toEngineValue(input, values[input.name] ?? '');
      }

      // Every public dynamic calculator must go through the verified handler registry.
      // No generic multiplication/division fallback is allowed: an unknown calculator
      // is an explicit configuration error rather than a plausible-looking fake result.
      const calculated = calculate(calculatorId, engineInputs);
      setResults(calculated);
      setError('');
    } catch (err: unknown) {
      setResults({});
      setError(err instanceof Error ? err.message : 'Unable to calculate with the verified formula.');
    }
  }, [calculatorId, safeInputs, values]);

  const handleChange = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const formatResult = (value: unknown): string => {
    if (Array.isArray(value)) return value.map((item) => typeof item === 'number' ? formatNumber(item) : String(item)).join(', ');
    if (typeof value === 'number') return Number.isFinite(value) ? formatNumber(value) : '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value == null ? '—' : String(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <section
        className="md:col-span-7 rounded-2xl border p-6 space-y-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">Inputs & Parameters</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Enter your values. Results update automatically using the calculator's verified formula.
          </p>
        </div>

        <div className="space-y-5">
          {safeInputs.map((input) => {
            const inputId = `${uid}-${input.name}`;
            const helpId = input.helpText ? `${inputId}-help` : undefined;
            const current = values[input.name] ?? String(input.defaultValue ?? '');

            return (
              <div key={input.name} className="space-y-2">
                <label htmlFor={inputId} className="block text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {input.label}{input.suffix ? ` (${input.suffix})` : ''}
                </label>

                {input.type === 'select' ? (
                  <select
                    id={inputId}
                    value={current}
                    aria-describedby={helpId}
                    onChange={(event) => handleChange(input.name, event.target.value)}
                    className="w-full min-h-[46px] px-3 border rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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
                    value={current}
                    aria-describedby={helpId}
                    onChange={(event) => handleChange(input.name, event.target.value)}
                    className="w-full min-h-[46px] px-3 border rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                )}

                {input.helpText && <p id={helpId} className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{input.helpText}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="md:col-span-5 space-y-6">
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          aria-live="polite"
        >
          <div className="text-center">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">Calculated Results</h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Verified engine output</p>
          </div>

          {error ? (
            <div role="alert" className="rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {error}
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

        <div className="rounded-2xl border p-5 text-xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Calculation integrity:</strong> this calculator executes only a registered formula from the verified calculator engine. Missing or invalid inputs produce an error instead of an invented result.
        </div>
      </section>
    </div>
  );
}
