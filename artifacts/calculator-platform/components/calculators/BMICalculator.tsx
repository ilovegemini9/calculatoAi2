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

export function BMICalculator() {
  const [system, setSystem] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);

  const result = calculateBMI({ system, weight, height });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Unit System">
            <select value={system} onChange={e => setSystem(e.target.value as 'metric' | 'imperial')} className={selectClass}>
              <option value="metric">Metric (kg / cm)</option>
              <option value="imperial">Imperial (lbs / in)</option>
            </select>
          </Field>
          <Field label={`Weight (${system === 'metric' ? 'kg' : 'lbs'})`}>
            <input type="number" value={weight} min={1} max={999} step={0.1}
              onChange={e => setWeight(parseFloat(e.target.value) || 0)} className={inputClass} />
          </Field>
          <Field label={`Height (${system === 'metric' ? 'cm' : 'inches'})`}>
            <input type="number" value={height} min={1} max={999} step={0.1}
              onChange={e => setHeight(parseFloat(e.target.value) || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="BMI" value={result.bmi.toString()} />
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</p>
            <p className={`text-xl font-black ${categoryColor[result.category] || 'text-white'}`}>{result.category}</p>
          </div>
          <ResultCard label="Healthy Range" value={result.healthyRangeText} />
        </ResultsPanel>
      </div>

      {/* Recommendation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Recommendation</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{result.recommendation}</p>
      </div>

      {/* BMI Scale */}
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
