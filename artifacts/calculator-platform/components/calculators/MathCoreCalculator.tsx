'use client';

import { useMemo, useState } from 'react';
import {
  fraction,
  quadratic,
  ratio,
  scientific,
  standardDeviation,
} from '@/lib/calculators/mathCore';
import {
  Field,
  inputClass,
  InputsPanel,
  ResultCard,
  ResultsPanel,
} from './ResultCard';

type Mode = 'scientific' | 'fraction' | 'standard-deviation' | 'ratio' | 'quadratic';

type NumericField = {
  key: 'a' | 'b' | 'c' | 'd';
  label: string;
  help?: string;
};

const modeFields: Record<Mode, NumericField[]> = {
  scientific: [
    { key: 'a', label: 'Value x', help: 'Angles for sine and cosine use radians.' },
  ],
  fraction: [
    { key: 'a', label: 'Numerator a' },
    { key: 'b', label: 'Denominator b' },
    { key: 'c', label: 'Numerator c' },
    { key: 'd', label: 'Denominator d' },
  ],
  'standard-deviation': [
    { key: 'a', label: 'Observation 1' },
    { key: 'b', label: 'Observation 2' },
    { key: 'c', label: 'Observation 3' },
    { key: 'd', label: 'Observation 4' },
  ],
  ratio: [
    { key: 'a', label: 'First quantity a' },
    { key: 'b', label: 'Second quantity b' },
  ],
  quadratic: [
    { key: 'a', label: 'Coefficient a', help: 'The x² coefficient cannot be zero for a quadratic.' },
    { key: 'b', label: 'Coefficient b' },
    { key: 'c', label: 'Coefficient c' },
  ],
};

export function MathCoreCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(5);
  const [b, setB] = useState(2);
  const [c, setC] = useState(3);
  const [d, setD] = useState(4);
  const values = { a, b, c, d };
  const setters = { a: setA, b: setB, c: setC, d: setD };

  const result = useMemo(() => {
    if (mode === 'scientific') return scientific(a);
    if (mode === 'fraction') return fraction(a, b, c, d);
    if (mode === 'standard-deviation') return standardDeviation([a, b, c, d]);
    if (mode === 'ratio') return ratio(a, b);
    return quadratic(a, b, c);
  }, [mode, a, b, c, d]);

  const scientificResult = result as ReturnType<typeof scientific>;
  const fractionResult = result as ReturnType<typeof fraction>;
  const standardDeviationResult = result as ReturnType<typeof standardDeviation>;
  const ratioResult = result as ReturnType<typeof ratio>;
  const quadraticResult = result as ReturnType<typeof quadratic>;

  const title =
    mode === 'scientific'
      ? 'Scientific Calculator'
      : mode === 'fraction'
        ? 'Fraction Calculator'
        : mode === 'standard-deviation'
          ? 'Standard Deviation Calculator'
          : mode === 'ratio'
            ? 'Ratio Calculator'
            : 'Quadratic Formula Calculator';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel title={`${title} Inputs`}>
        {modeFields[mode].map((field) => (
          <Field key={field.key} label={field.label} htmlFor={`${mode}-${field.key}`}>
            <input
              id={`${mode}-${field.key}`}
              type="number"
              inputMode="decimal"
              value={values[field.key]}
              aria-describedby={field.help ? `${mode}-${field.key}-help` : undefined}
              onChange={(event) => {
                const next = event.currentTarget.valueAsNumber;
                setters[field.key](Number.isFinite(next) ? next : 0);
              }}
              className={inputClass}
            />
            {field.help && (
              <span id={`${mode}-${field.key}-help`} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {field.help}
              </span>
            )}
          </Field>
        ))}
        {mode === 'scientific' && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Evaluates x², sin(x), cos(x), and ln(x). For x ≤ 0, the guarded natural-log result is 0 because ln is undefined there.
          </p>
        )}
      </InputsPanel>

      <ResultsPanel title={`Live ${title} Results`}>
        {mode === 'scientific' ? (
          <>
            <ResultCard highlight label="Square x²" value={scientificResult.square.toFixed(4)} />
            <ResultCard label="Sine sin(x)" value={scientificResult.sin.toFixed(4)} />
            <ResultCard label="Cosine cos(x)" value={scientificResult.cos.toFixed(4)} />
            <ResultCard label="Natural log ln(x)" value={scientificResult.ln.toFixed(4)} />
          </>
        ) : mode === 'fraction' ? (
          <>
            <ResultCard highlight label="Reduced Numerator" value={`${fractionResult.reducedNumerator}`} />
            <ResultCard label="Reduced Denominator" value={`${fractionResult.reducedDenominator}`} />
          </>
        ) : mode === 'standard-deviation' ? (
          <>
            <ResultCard highlight label="Population SD" value={standardDeviationResult.standardDeviation.toFixed(4)} />
            <ResultCard label="Mean" value={standardDeviationResult.mean.toFixed(4)} />
          </>
        ) : mode === 'ratio' ? (
          <>
            <ResultCard highlight label="Simplified Ratio" value={`${ratioResult.simplifiedFirst}:${ratioResult.simplifiedSecond}`} />
            <ResultCard label="Decimal Ratio" value={ratioResult.ratio.toFixed(4)} />
          </>
        ) : (
          <>
            <ResultCard highlight label="Discriminant" value={quadraticResult.discriminant.toFixed(4)} />
            <ResultCard label="Roots" value={quadraticResult.roots.length ? quadraticResult.roots.map((root) => root.toFixed(4)).join(', ') : 'No real roots'} />
          </>
        )}
      </ResultsPanel>
    </div>
  );
}

export const ScientificCoreCalculator = () => <MathCoreCalculator mode="scientific" />;
export const FractionCoreCalculator = () => <MathCoreCalculator mode="fraction" />;
export const StandardDeviationCalculator = () => <MathCoreCalculator mode="standard-deviation" />;
export const RatioCoreCalculator = () => <MathCoreCalculator mode="ratio" />;
export const QuadraticFormulaCalculator = () => <MathCoreCalculator mode="quadratic" />;
