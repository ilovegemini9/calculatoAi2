'use client';

import { useState } from 'react';
import { calculateCalorie, type CalorieInput } from '@/lib/calculators/calorie/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';

export function CalorieCalculator() {
  const [form, setForm] = useState<CalorieInput>({
    system: 'metric',
    age: 30,
    gender: 'male',
    weight: 75,
    height: 175,
    activity: 'moderate',
  });

  const set = (k: keyof CalorieInput, v: CalorieInput[keyof CalorieInput]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const result = calculateCalorie(form);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Unit System">
            <select value={form.system} onChange={e => set('system', e.target.value as CalorieInput['system'])} className={selectClass}>
              <option value="metric">Metric (kg / cm)</option>
              <option value="imperial">Imperial (lbs / in)</option>
            </select>
          </Field>
          <Field label="Gender">
            <select value={form.gender} onChange={e => set('gender', e.target.value as CalorieInput['gender'])} className={selectClass}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="Age (years)">
            <input type="number" value={form.age} min={1} max={120} onChange={e => set('age', +e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label={`Weight (${form.system === 'metric' ? 'kg' : 'lbs'})`}>
            <input type="number" value={form.weight} min={1} max={999} step={0.1} onChange={e => set('weight', +e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label={`Height (${form.system === 'metric' ? 'cm' : 'inches'})`}>
            <input type="number" value={form.height} min={1} max={999} step={0.1} onChange={e => set('height', +e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Activity Level">
            <select value={form.activity} onChange={e => set('activity', e.target.value as CalorieInput['activity'])} className={selectClass}>
              <option value="sedentary">Sedentary (little/no exercise)</option>
              <option value="light">Light (1–3 days/week)</option>
              <option value="moderate">Moderate (3–5 days/week)</option>
              <option value="active">Active (6–7 days/week)</option>
              <option value="very_active">Very Active (hard exercise 2×/day)</option>
            </select>
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Maintenance Calories" value={`${result.maintain.toLocaleString()} kcal`} />
          <ResultCard label="BMR (base metabolic rate)" value={`${result.bmr.toLocaleString()} kcal`} />
          <ResultCard label="TDEE" value={`${result.tdee.toLocaleString()} kcal`} />
        </ResultsPanel>
      </div>

      {/* Goal table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Calorie Goals</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { label: 'Extreme Weight Loss (−1 kg/wk)', value: result.extremeLoss, color: 'text-red-600' },
            { label: 'Weight Loss (−0.5 kg/wk)', value: result.weightLoss, color: 'text-orange-600' },
            { label: 'Mild Weight Loss (−0.25 kg/wk)', value: result.mildLoss, color: 'text-yellow-600' },
            { label: 'Maintain Weight', value: result.maintain, color: 'text-green-600' },
            { label: 'Mild Weight Gain (+0.25 kg/wk)', value: result.mildGain, color: 'text-blue-600' },
            { label: 'Weight Gain (+0.5 kg/wk)', value: result.weightGain, color: 'text-purple-600' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center px-5 py-3">
              <span className="text-sm text-slate-700">{row.label}</span>
              <span className={`font-black text-sm ${row.color}`}>{row.value.toLocaleString()} kcal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
