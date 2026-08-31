'use client';

import { useMemo, useState } from 'react';
import { combination, factorial, percentile } from '@/lib/calculators/omniMathWave';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

type Mode = 'factorial' | 'combination' | 'percentile';

export function OmniMathWaveCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(mode === 'factorial' ? 5 : mode === 'combination' ? 10 : 1);
  const [b, setB] = useState(mode === 'combination' ? 3 : 2);
  const [c, setC] = useState(3);
  const [d, setD] = useState(4);
  const title = mode === 'factorial' ? 'Factorial Calculator' : mode === 'combination' ? 'Combination Calculator' : 'Percentile Calculator';
  const result = useMemo(() => {
    if (mode === 'factorial') return factorial(a);
    if (mode === 'combination') return combination(a, b);
    return percentile([a, b, c, d], 50);
  }, [mode, a, b, c, d]);
  const setNumber = (setter: (value: number) => void, value: string) => {
    const next = Number(value);
    setter(Number.isFinite(next) ? next : 0);
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel title={`${title} Inputs`}>
        <Field label={mode === 'factorial' ? 'Non-negative integer (n)' : mode === 'combination' ? 'Population size (n)' : 'Observation 1'} htmlFor={`${mode}-a`}>
          <input id={`${mode}-a`} type="number" min={0} step={1} value={a} onChange={(e) => setNumber(setA, e.currentTarget.value)} className={inputClass} />
        </Field>
        {mode === 'combination' && <Field label="Selected items (r)" htmlFor="combination-b"><input id="combination-b" type="number" min={0} step={1} value={b} onChange={(e) => setNumber(setB, e.currentTarget.value)} className={inputClass} /></Field>}
        {mode === 'percentile' && <>
          <Field label="Observation 2" htmlFor="percentile-b"><input id="percentile-b" type="number" step={0.01} value={b} onChange={(e) => setNumber(setB, e.currentTarget.value)} className={inputClass} /></Field>
          <Field label="Observation 3" htmlFor="percentile-c"><input id="percentile-c" type="number" step={0.01} value={c} onChange={(e) => setNumber(setC, e.currentTarget.value)} className={inputClass} /></Field>
          <Field label="Observation 4" htmlFor="percentile-d"><input id="percentile-d" type="number" step={0.01} value={d} onChange={(e) => setNumber(setD, e.currentTarget.value)} className={inputClass} /></Field>
        </>}
      </InputsPanel>
      <ResultsPanel title={`Live ${title} Results`}>
        <ResultCard highlight label={mode === 'factorial' ? 'n factorial' : mode === 'combination' ? 'Combinations C(n,r)' : '50th percentile (median)'} value={result.toLocaleString(undefined, { maximumFractionDigits: 8 })} sub={mode === 'factorial' ? 'n! multiplies the positive integers from 1 through n.' : mode === 'combination' ? 'Order is not considered in the selection.' : 'Linear interpolation is used between ordered observations when needed.'} />
      </ResultsPanel>
    </div>
  );
}

export const FactorialCalculator = () => <OmniMathWaveCalculator mode="factorial" />;
export const CombinationCalculator = () => <OmniMathWaveCalculator mode="combination" />;
export const PercentileCalculator = () => <OmniMathWaveCalculator mode="percentile" />;
