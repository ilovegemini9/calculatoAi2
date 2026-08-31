'use client';

import { useState, useEffect, useId, useMemo } from 'react';
import { formatNumber } from '@/lib/utils';
import type { CalculatorInput, CalculatorOutput } from '@/lib/types';

interface Props {
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  calculatorId: string;
}

type CalculatorFn = (inputs: Record<string, string | number>) => Record<string, unknown>;

const PRESET_CALCULATORS: Record<string, CalculatorFn> = {
  percentage: (inputs) => {
    const part = Number(inputs.part ?? inputs.value ?? 0);
    const whole = Number(inputs.whole ?? 0);
    if (!Number.isFinite(part) || !Number.isFinite(whole) || whole === 0) throw new Error('Whole must not be zero');
    return { percentage: (part / whole) * 100 };
  },
  'percentage-increase': (inputs) => {
    const original = Number(inputs.original);
    const next = Number(inputs.new);
    if (!Number.isFinite(original) || original === 0 || !Number.isFinite(next)) throw new Error('Enter valid values; original must not be zero');
    return { increasePercent: ((next - original) / Math.abs(original)) * 100 };
  },
  'percentage-decrease': (inputs) => {
    const original = Number(inputs.original);
    const next = Number(inputs.new);
    if (!Number.isFinite(original) || original === 0 || !Number.isFinite(next)) throw new Error('Enter valid values; original must not be zero');
    return { decreasePercent: ((original - next) / Math.abs(original)) * 100 };
  },
  average: (inputs) => {
    const raw = String(inputs.values ?? '').split(/[,\s]+/).filter(Boolean).map(Number);
    if (!raw.length || raw.some((x) => !Number.isFinite(x))) throw new Error('Enter numbers separated by commas or spaces');
    return { mean: raw.reduce((sum, x) => sum + x, 0) / raw.length };
  },
  'square-root': (inputs) => {
    const value = Number(inputs.value);
    if (!Number.isFinite(value) || value < 0) throw new Error('Value must be a non-negative number');
    return { root: Math.sqrt(value) };
  },
  exponent: (inputs) => {
    const base = Number(inputs.base);
    const exponent = Number(inputs.exponent);
    if (!Number.isFinite(base) || !Number.isFinite(exponent)) throw new Error('Enter valid numbers');
    return { power: Math.pow(base, exponent) };
  },
  factorial: (inputs) => {
    const n = Number(inputs.n ?? inputs.value ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('n must be an integer from 0 to 170');
    let factorial = 1;
    for (let i = 2; i <= n; i += 1) factorial *= i;
    return { factorial };
  },
  combination: (inputs) => {
    const n = Number(inputs.n);
    const r = Number(inputs.r);
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n || n > 170) throw new Error('Enter integers with 0 ≤ r ≤ n ≤ 170');
    const k = Math.min(r, n - r);
    let value = 1;
    for (let i = 1; i <= k; i += 1) value = (value * (n - k + i)) / i;
    return { combinations: value };
  },
  ratio: (inputs) => {
    const a = Number(inputs.a ?? inputs.inputA ?? 1);
    const b = Number(inputs.b ?? inputs.inputB ?? 1);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) throw new Error('Enter valid non-zero ratio values');
    const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
    const divisor = gcd(Math.trunc(a), Math.trunc(b)) || 1;
    return { simplifiedRatio: `${a / divisor}:${b / divisor}`, decimal: a / b };
  },
  'pythagorean-theorem': (inputs) => {
    const a = Number(inputs.a ?? inputs.sideA ?? 0);
    const b = Number(inputs.b ?? inputs.sideB ?? 0);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) throw new Error('Side lengths must be non-negative');
    return { hypotenuse: Math.hypot(a, b) };
  },
  circle: (inputs) => {
    const radius = Number(inputs.radius ?? inputs.r ?? 0);
    if (!Number.isFinite(radius) || radius < 0) throw new Error('Radius must be non-negative');
    return { area: Math.PI * radius * radius, circumference: 2 * Math.PI * radius };
  },
};

function executeDynamicMath(
  calculatorId: string,
  inputs: Record<string, string | number>,
  outputs: CalculatorOutput[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const numValues = Object.entries(inputs)
    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
    .map(([k, v]) => ({ key: k, value: Number(v) }));

  // Check specific output keys
  for (const out of outputs) {
    const k = out.name;
    if (k === 'result' || k === 'calculatedAmount' || k === 'primaryResult') {
      if (inputs.value !== undefined && inputs.percentage !== undefined) {
        result[k] = (Number(inputs.value) * Number(inputs.percentage)) / 100;
      } else if (inputs.amount !== undefined && inputs.rate !== undefined && inputs.period !== undefined) {
        const p = Number(inputs.amount);
        const r = Number(inputs.rate) / 100;
        const t = Number(inputs.period) / 12;
        result[k] = p * Math.pow(1 + r, t);
      } else if (numValues.length >= 2) {
        result[k] = numValues[0].value * numValues[1].value;
      } else if (numValues.length === 1) {
        result[k] = numValues[0].value;
      }
    } else if (k === 'totalWithPercent') {
      const v = Number(inputs.value || 0);
      const p = Number(inputs.percentage || 0);
      result[k] = v + (v * p) / 100;
    } else if (k === 'area') {
      const l = Number(inputs.length || 0);
      const w = Number(inputs.width || 0);
      result[k] = l * w;
    } else if (k === 'perimeter') {
      const l = Number(inputs.length || 0);
      const w = Number(inputs.width || 0);
      result[k] = 2 * (l + w);
    } else if (k === 'volume') {
      const l = Number(inputs.length || 0);
      const w = Number(inputs.width || 0);
      const h = Number(inputs.height || 0);
      result[k] = l * w * h;
    } else if (k === 'capacityLiters') {
      const l = Number(inputs.length || 0);
      const w = Number(inputs.width || 0);
      const h = Number(inputs.height || 0);
      result[k] = l * w * h * 1000;
    } else if (k === 'rate' || k === 'speed') {
      const d = Number(inputs.distance || 0);
      const t = Number(inputs.time || 1);
      result[k] = t !== 0 ? d / t : 0;
    } else if (k === 'pace') {
      const d = Number(inputs.distance || 1);
      const t = Number(inputs.time || 0);
      result[k] = d !== 0 ? (t * 60) / d : 0;
    } else if (k === 'periodicCost') {
      const p = Number(inputs.amount || 0);
      const terms = Number(inputs.period || 1);
      result[k] = terms !== 0 ? p / terms : 0;
    } else if (k === 'netDifference') {
      const p = Number(inputs.amount || 0);
      const r = Number(inputs.rate || 0);
      result[k] = (p * r) / 100;
    } else if (k === 'score') {
      const w = Number(inputs.weight || 70);
      const h = Number(inputs.height || 175) / 100;
      result[k] = h > 0 ? w / (h * h) : 0;
    } else if (k === 'dailyTarget') {
      const w = Number(inputs.weight || 70);
      const age = Number(inputs.age || 28);
      result[k] = Math.round(10 * w + 6.25 * 175 - 5 * age + 5);
    } else if (k === 'calculatedMagnitude') {
      const a = Number(inputs.paramA || 0);
      const b = Number(inputs.paramB || 0);
      result[k] = a * b;
    } else if (k === 'derivedFactor' || k === 'derivedRate') {
      const a = Number(inputs.paramA || 0);
      const b = Number(inputs.paramB || 1);
      result[k] = b !== 0 ? a / b : 0;
    } else if (k === 'secondaryRatio') {
      const a = Number(inputs.inputA || 0);
      const b = Number(inputs.inputB || 0);
      result[k] = a + b !== 0 ? (a / (a + b)) * 100 : 0;
    } else if (result[k] === undefined) {
      if (numValues.length >= 2) {
        result[k] = numValues[0].value / (numValues[1].value || 1);
      } else if (numValues.length === 1) {
        result[k] = numValues[0].value;
      } else {
        result[k] = 0;
      }
    }
  }

  return result;
}

export function DynamicCalculator({ inputs, outputs, calculatorId }: Props) {
  const uid = useId();
  const safeInputs = useMemo(() => (Array.isArray(inputs) ? inputs : []), [inputs]);
  const safeOutputs = useMemo(() => (Array.isArray(outputs) ? outputs : []), [outputs]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const errorId = `${uid}-error`;

  useEffect(() => {
    const initial: Record<string, string> = {};
    safeInputs.forEach((inp) => {
      initial[inp.name] = String(inp.defaultValue ?? '');
    });
    setValues(initial);
  }, [safeInputs]);

  useEffect(() => {
    if (Object.keys(values).length === 0) return;
    setError('');
    try {
      const inputsObj: Record<string, string | number> = {};
      safeInputs.forEach((inp) => {
        const val = values[inp.name] ?? '';
        inputsObj[inp.name] = inp.type === 'number' ? Number(val || 0) : val;
      });

      const preset = PRESET_CALCULATORS[calculatorId];
      if (preset) {
        setResults(preset(inputsObj));
      } else {
        setResults(executeDynamicMath(calculatorId, inputsObj, safeOutputs));
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error in mathematical calculations.');
      setResults({});
    }
  }, [values, calculatorId, safeInputs, safeOutputs]);

  const handleInputChange = (name: string, val: string) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div
        className="md:col-span-7 rounded-2xl border p-6 space-y-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">
          Variables & Parameters
        </h2>
        <div className="space-y-4">
          {safeInputs.map((inp) => {
            const currentVal = values[inp.name] ?? String(inp.defaultValue ?? '');
            const inputId = `${uid}-${inp.name}`;
            const helpId = inp.helpText ? `${uid}-${inp.name}-help` : undefined;
            const rangeId = `${uid}-${inp.name}-range`;
            return (
              <div key={inp.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label
                    htmlFor={inp.type === 'number' ? rangeId : inputId}
                    className="font-bold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {inp.label}
                  </label>
                  {inp.type === 'number' && (
                    <span
                      className="font-semibold font-mono"
                      style={{ color: 'var(--text-primary)' }}
                      aria-live="polite"
                    >
                      {currentVal} {inp.suffix}
                    </span>
                  )}
                </div>
                {inp.type === 'number' ? (
                  <div className="space-y-2">
                    <input
                      id={rangeId}
                      type="range"
                      min={inp.min ?? 0}
                      max={inp.max ?? 1000}
                      step={inp.step ?? 1}
                      value={Number(currentVal || 0)}
                      aria-label={`${inp.label} slider`}
                      aria-describedby={helpId}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      className="w-full h-5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                    <input
                      id={inputId}
                      type="number"
                      min={inp.min}
                      max={inp.max}
                      step={inp.step}
                      value={currentVal}
                      aria-label={`${inp.label} value`}
                      aria-describedby={helpId}
                      onChange={(e) => handleInputChange(inp.name, e.target.value)}
                      className="w-full p-2.5 min-h-[44px] border rounded-lg text-sm outline-none font-medium focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:border-[var(--border-focus)]"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                ) : (
                  <input
                    id={inputId}
                    type="text"
                    value={currentVal}
                    aria-label={inp.label}
                    aria-describedby={helpId}
                    onChange={(e) => handleInputChange(inp.name, e.target.value)}
                    className="w-full p-3 min-h-[44px] border rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:border-[var(--border-focus)]"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                )}
                {inp.helpText && (
                  <p id={helpId} className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {inp.helpText}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="md:col-span-5 space-y-6">
        <div
          className="rounded-2xl border p-6 text-center space-y-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">
            Calculated Results
          </h2>
          {error ? (
            <div
              id={errorId}
              role="alert"
              aria-live="assertive"
              className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl"
            >
              ⚠️ {error}
            </div>
          ) : (
            <div className="space-y-4" aria-live="polite" aria-label="Calculation results">
              {safeOutputs.map((out) => {
                const rawVal = results[out.name];
                const displayVal =
                  typeof rawVal === 'number'
                    ? formatNumber(rawVal, 2)
                    : String(rawVal ?? '0');
                return (
                  <div
                    key={out.name}
                    className={`p-4 rounded-xl border ${
                      out.highlight ? 'bg-blue-500/5 border-blue-500/20' : ''
                    }`}
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {out.label}
                    </span>
                    <p
                      className={`text-2xl font-black mt-1 ${
                        out.highlight ? 'text-blue-500' : ''
                      }`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {displayVal}{' '}
                      <span className="text-sm font-bold">{out.suffix}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
