/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState } from 'react';
import { egfrCkdEpi2021, pace, widmarkBac } from '@/lib/calculators/clinicalAdvanced';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

type Mode = 'pace' | 'gfr' | 'bac';

export function ClinicalAdvancedCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(70);
  const [b, setB] = useState(30);
  const [c, setC] = useState(5);
  const [female, setFemale] = useState(false);

  const x = useMemo<any>(() => {
    if (mode === 'pace') return pace(a, b);
    if (mode === 'gfr') return { gfr: egfrCkdEpi2021(a, b, female ? 'female' : 'male') };
    return widmarkBac(a, b, c, female ? 'female' : 'male');
  }, [mode, a, b, c, female]);

  const title = mode === 'pace' ? 'Pace Calculator' : mode === 'gfr' ? 'GFR Calculator' : 'BAC Calculator';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel title={`${title} Inputs`}>
        <Field
          label={mode === 'pace' ? 'Distance (km)' : mode === 'gfr' ? 'Serum Creatinine (mg/dL)' : 'Alcohol (grams)'}
          htmlFor={`${mode}-a`}
        >
          <input
            id={`${mode}-a`}
            type="number"
            min={0}
            step={0.01}
            value={a}
            onChange={(e) => setA(e.currentTarget.valueAsNumber || 0)}
            className={inputClass}
          />
        </Field>

        <Field
          label={mode === 'pace' ? 'Duration (minutes)' : mode === 'gfr' ? 'Age (years)' : 'Body Weight (kg)'}
          htmlFor={`${mode}-b`}
        >
          <input
            id={`${mode}-b`}
            type="number"
            min={0}
            step={mode === 'gfr' ? 1 : 0.01}
            value={b}
            onChange={(e) => setB(e.currentTarget.valueAsNumber || 0)}
            className={inputClass}
          />
        </Field>

        {mode === 'bac' && (
          <Field label="Hours since first drink" htmlFor="bac-c">
            <input
              id="bac-c"
              type="number"
              min={0}
              step={0.1}
              value={c}
              onChange={(e) => setC(e.currentTarget.valueAsNumber || 0)}
              className={inputClass}
            />
          </Field>
        )}

        {mode !== 'pace' && (
          <Field label="Female physiology" htmlFor={`${mode}-female`}>
            <input
              id={`${mode}-female`}
              type="checkbox"
              checked={female}
              onChange={(e) => setFemale(e.currentTarget.checked)}
            />
          </Field>
        )}
      </InputsPanel>

      <ResultsPanel title={`Live ${title} Results`}>
        {mode === 'pace' ? (
          <ResultCard highlight label="Pace (min/km)" value={x.pace.toFixed(2)} sub="Training estimate only." />
        ) : mode === 'gfr' ? (
          <ResultCard
            highlight
            label="eGFR (mL/min/1.73m²)"
            value={x.gfr.toFixed(1)}
            sub="CKD-EPI 2021 adult estimate; not a diagnosis."
          />
        ) : (
          <>
            <ResultCard
              highlight
              label="Estimated BAC (%)"
              value={x.estimated.toFixed(3)}
              sub="Widmark-style estimate; never use it to decide whether to drive."
            />
            <ResultCard label="Estimated peak BAC (%)" value={x.peak.toFixed(3)} />
          </>
        )}
      </ResultsPanel>
    </div>
  );
}

export const PaceAdvancedCalculator = () => <ClinicalAdvancedCalculator mode="pace" />;
export const GfrAdvancedCalculator = () => <ClinicalAdvancedCalculator mode="gfr" />;
export const BacAdvancedCalculator = () => <ClinicalAdvancedCalculator mode="bac" />;
