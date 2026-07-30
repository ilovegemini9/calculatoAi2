'use client';

import { useState } from 'react';
import { calculatePercentage, type PercentageInput } from '@/lib/calculators/percentage/formula';
import { InputsPanel, Field, inputClass, selectClass } from './ResultCard';

export function PercentageCalculator() {
  const [caseType, setCaseType] = useState<PercentageInput['caseType']>('percentOf');
  const [x, setX] = useState(25);
  const [y, setY] = useState(200);

  const result = calculatePercentage({ caseType, x, y });

  const labels: Record<PercentageInput['caseType'], { x: string; y: string; question: string }> = {
    percentOf:     { x: 'Percentage (%)', y: 'Of what number?', question: `What is ${x}% of ${y}?` },
    whatPercentOf: { x: 'What number (X)?', y: 'Is what percent of Y?', question: `${x} is what percent of ${y}?` },
    change:        { x: 'From (original value)', y: 'To (new value)', question: `Percent change from ${x} to ${y}?` },
  };

  const lbl = labels[caseType];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Calculation Type" htmlFor="pct-case">
            <select id="pct-case" value={caseType}
              aria-label="Type of percentage calculation"
              onChange={e => setCaseType(e.target.value as PercentageInput['caseType'])} className={selectClass}>
              <option value="percentOf">What is X% of Y?</option>
              <option value="whatPercentOf">X is what % of Y?</option>
              <option value="change">% change from X to Y?</option>
            </select>
          </Field>
          <Field label={lbl.x} htmlFor="pct-x">
            <input id="pct-x" type="number" value={x} step="any"
              aria-label={lbl.x}
              onChange={e => setX(parseFloat(e.target.value) || 0)} className={inputClass} />
          </Field>
          <Field label={lbl.y} htmlFor="pct-y">
            <input id="pct-y" type="number" value={y} step="any"
              aria-label={lbl.y}
              onChange={e => setY(parseFloat(e.target.value) || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        {/* Result display */}
        <div
          className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-center gap-4"
          aria-live="polite"
          aria-label="Calculation result"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{lbl.question}</p>
          {result.explanation && (
            <p className="text-3xl font-black text-white">
              {result.result.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              {caseType !== 'percentOf' ? '%' : ''}
            </p>
          )}
          <p className="text-sm text-slate-400 leading-relaxed border-t border-white/10 pt-4">
            {result.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
