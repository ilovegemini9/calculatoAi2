'use client';

import { useMemo, useState } from 'react';
import { area, distance, permutation, probability, sampleSize, summary } from '@/lib/calculators/mathStats';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

type Mode = 'area' | 'distance' | 'sample-size' | 'probability' | 'statistics' | 'permutation-and-combination';

type InputSpec = { key: 'a' | 'b' | 'c' | 'd'; label: string; step?: number; min?: number };

const inputSpecs: Record<Mode, InputSpec[]> = {
  area: [{ key: 'a', label: 'Radius', min: 0, step: 0.01 }],
  distance: [
    { key: 'a', label: 'Point 1 — X', step: 0.01 },
    { key: 'b', label: 'Point 1 — Y', step: 0.01 },
    { key: 'c', label: 'Point 2 — X', step: 0.01 },
    { key: 'd', label: 'Point 2 — Y', step: 0.01 },
  ],
  'sample-size': [
    { key: 'a', label: 'Z-score', min: 0, step: 0.01 },
    { key: 'b', label: 'Expected proportion (%)', min: 0, step: 0.1 },
    { key: 'c', label: 'Margin of error (%)', min: 0, step: 0.1 },
  ],
  probability: [
    { key: 'a', label: 'Successful outcomes (k)', min: 0, step: 1 },
    { key: 'b', label: 'Total trials (n)', min: 0, step: 1 },
    { key: 'c', label: 'Success probability (%)', min: 0, step: 0.1 },
  ],
  statistics: [
    { key: 'a', label: 'Observation 1', step: 0.01 },
    { key: 'b', label: 'Observation 2', step: 0.01 },
    { key: 'c', label: 'Observation 3', step: 0.01 },
    { key: 'd', label: 'Observation 4', step: 0.01 },
  ],
  'permutation-and-combination': [
    { key: 'a', label: 'Population size (n)', min: 0, step: 1 },
    { key: 'b', label: 'Selected items (r)', min: 0, step: 1 },
  ],
};

const titles: Record<Mode, string> = {
  area: 'Area Calculator',
  distance: 'Distance Calculator',
  'sample-size': 'Sample Size Calculator',
  probability: 'Probability Calculator',
  statistics: 'Statistics Calculator',
  'permutation-and-combination': 'Permutation and Combination Calculator',
};

export function MathStatsCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(mode === 'sample-size' ? 1.96 : mode === 'probability' ? 2 : mode === 'statistics' ? 1 : mode === 'distance' ? 0 : 10);
  const [b, setB] = useState(mode === 'sample-size' ? 50 : mode === 'probability' ? 10 : mode === 'statistics' ? 2 : mode === 'distance' ? 0 : mode === 'permutation-and-combination' ? 3 : 5);
  const [c, setC] = useState(mode === 'sample-size' ? 5 : mode === 'probability' ? 50 : mode === 'statistics' ? 2 : mode === 'distance' ? 3 : 3);
  const [d, setD] = useState(mode === 'statistics' ? 4 : mode === 'distance' ? 4 : 2);
  const values = { a, b, c, d };
  const setters = { a: setA, b: setB, c: setC, d: setD };

  const result = useMemo(() => {
    if (mode === 'area') return { kind: 'area' as const, ...area(a) };
    if (mode === 'distance') return { kind: 'distance' as const, value: distance(a, b, c, d) };
    if (mode === 'sample-size') return { kind: 'sample-size' as const, value: sampleSize(a, b / 100, c / 100) };
    if (mode === 'probability') return { kind: 'probability' as const, value: probability(a, b, c / 100) };
    if (mode === 'statistics') return { kind: 'statistics' as const, ...summary([a, b, c, d]) };
    return { kind: 'permutation-and-combination' as const, value: permutation(a, b) };
  }, [mode, a, b, c, d]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel title={`${titles[mode]} Inputs`}>
        {inputSpecs[mode].map((field) => (
          <Field key={field.key} label={field.label} htmlFor={`${mode}-${field.key}`}>
            <input
              id={`${mode}-${field.key}`}
              type="number"
              inputMode="decimal"
              min={field.min}
              step={field.step ?? 0.01}
              value={values[field.key]}
              onChange={(event) => {
                const next = event.currentTarget.valueAsNumber;
                setters[field.key](Number.isFinite(next) ? next : 0);
              }}
              className={inputClass}
            />
          </Field>
        ))}
      </InputsPanel>
      <ResultsPanel title={`Live ${titles[mode]} Results`}>
        {result.kind === 'area' ? (
          <>
            <ResultCard highlight label="Circle area" value={result.circle.toFixed(4)} />
            <ResultCard label="Sphere surface area" value={result.surface.toFixed(4)} />
          </>
        ) : result.kind === 'statistics' ? (
          <>
            <ResultCard highlight label="Mean" value={result.mean.toFixed(4)} />
            <ResultCard label="Median" value={result.median.toFixed(4)} />
            <ResultCard label="Mode" value={result.mode.toFixed(4)} />
            <ResultCard label="Range" value={result.range.toFixed(4)} />
          </>
        ) : result.kind === 'sample-size' ? (
          <ResultCard highlight label="Required sample size" value={`${result.value}`} sub="Rounded up from the proportion and margin assumptions." />
        ) : result.kind === 'probability' ? (
          <ResultCard highlight label="Exact probability" value={`${(result.value * 100).toFixed(4)}%`} sub="Binomial probability for exactly k successes." />
        ) : result.kind === 'distance' ? (
          <ResultCard highlight label="Distance" value={result.value.toFixed(4)} />
        ) : (
          <ResultCard highlight label="Permutations P(n,r)" value={`${result.value}`} sub="Ordered selections without replacement." />
        )}
      </ResultsPanel>
    </div>
  );
}

export const AreaCalculator = () => <MathStatsCalculator mode="area" />;
export const DistanceCalculator = () => <MathStatsCalculator mode="distance" />;
export const SampleSizeCalculator = () => <MathStatsCalculator mode="sample-size" />;
export const ProbabilityCalculator = () => <MathStatsCalculator mode="probability" />;
export const StatisticsCalculator = () => <MathStatsCalculator mode="statistics" />;
export const PermutationCombinationCalculator = () => <MathStatsCalculator mode="permutation-and-combination" />;
