'use client';

import { useState } from 'react';
import { calculateBMI } from '@/lib/calculators/bmi/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';

const categoryColor: Record<string, string> = {
  'Underweight': 'text-blue-400',
  'Normal weight': 'text-green-400',
  'Overweight': 'text-yellow-400',
  'Obese': 'text-red-400',
};

function roundTo(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function BMICalculator() {
  const [system, setSystem] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);

  const result = calculateBMI({ system, weight, height });
  const weightLabel = `Weight (${system === 'metric' ? 'kg' : 'lbs'})`;
  const heightLabel = `Height (${system === 'metric' ? 'cm' : 'inches'})`;

  function handleSystemChange(nextSystem: 'metric' | 'imperial') {
    if (nextSystem === system) return;

    if (nextSystem === 'imperial') {
      setWeight(roundTo(weight * 2.2046226218));
      setHeight(roundTo(height / 2.54));
    } else {
      setWeight(roundTo(weight / 2.2046226218));
      setHeight(roundTo(height * 2.54));
    }

    setSystem(nextSystem);
  }

  const hasValidInputs = weight > 0 && height > 0 && Number.isFinite(weight) && Number.isFinite(height);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Unit System" htmlFor="bmi-system">
            <select
              id="bmi-system"
              value={system}
              aria-label="Unit system for BMI calculation"
              onChange={e => handleSystemChange(e.target.value as 'metric' | 'imperial')}
              className={selectClass}
            >
              <option value="metric">Metric (kg / cm)</option>
              <option value="imperial">Imperial (lbs / in)</option>
            </select>
          </Field>
          <Field label={weightLabel} htmlFor="bmi-weight">
            <input
              id="bmi-weight"
              type="number"
              value={weight}
              min={1}
              max={999}
              step={0.1}
              aria-label={weightLabel}
              onChange={e => setWeight(e.currentTarget.valueAsNumber || 0)}
              className={inputClass}
            />
          </Field>
          <Field label={heightLabel} htmlFor="bmi-height">
            <input
              id="bmi-height"
              type="number"
              value={height}
              min={1}
              max={999}
              step={0.1}
              aria-label={heightLabel}
              onChange={e => setHeight(e.currentTarget.valueAsNumber || 0)}
              className={inputClass}
            />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          {hasValidInputs ? (
            <>
              <ResultCard highlight label="BMI" value={result.bmi.toString()} />
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</p>
                <p className={`text-xl font-black ${categoryColor[result.category] || 'text-white'}`}>{result.category}</p>
              </div>
              <ResultCard label="Healthy Range" value={result.healthyRangeText} />
            </>
          ) : (
            <ResultCard highlight label="BMI" value="Enter valid weight and height" />
          )}
        </ResultsPanel>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Recommendation</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{result.recommendation}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">BMI Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { range: '< 18.5', label: 'Underweight', color: 'bg-blue-100 text-blue-700' },
            { range: '18.5 – 24.9', label: 'Normal', color: 'bg-green-100 text-green-700' },
            { range: '25.0 – 29.9', label: 'Overweight', color: 'bg-yellow-100 text-yellow-700' },
            { range: '≥ 30.0', label: 'Obese', color: 'bg-red-100 text-red-700' },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg p-3 text-center ${item.color}`}>
              <p className="font-black text-sm">{item.range}</p>
              <p className="text-xs font-semibold mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
