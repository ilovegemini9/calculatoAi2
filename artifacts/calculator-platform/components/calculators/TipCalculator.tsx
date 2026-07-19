'use client';

import { useState } from 'react';
import { calculateTip } from '@/lib/calculators/tip/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

const QUICK_TIPS = [10, 15, 18, 20, 22, 25];

export function TipCalculator() {
  const [billAmount, setBillAmount] = useState(50);
  const [tipPercent, setTipPercent] = useState(18);
  const [splitPeople, setSplitPeople] = useState(2);

  const result = calculateTip({ billAmount, tipPercent, splitPeople });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Bill Amount ($)">
            <input type="number" value={billAmount} min={0} step={0.01}
              onChange={e => setBillAmount(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Tip Percentage (%)">
            <input type="number" value={tipPercent} min={0} max={100} step={1}
              onChange={e => setTipPercent(+e.target.value || 0)} className={inputClass} />
            {/* Quick tip buttons */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {QUICK_TIPS.map(t => (
                <button key={t} onClick={() => setTipPercent(t)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${tipPercent === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                  {t}%
                </button>
              ))}
            </div>
          </Field>
          <Field label="Split Among (people)">
            <input type="number" value={splitPeople} min={1} max={100} step={1}
              onChange={e => setSplitPeople(Math.max(1, +e.target.value || 1))} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Total Per Person" value={formatCurrency(result.totalPerPerson)} />
          <ResultCard label="Tip Per Person" value={formatCurrency(result.tipPerPerson)} />
          <ResultCard label="Tip Amount" value={formatCurrency(result.tipAmount)} />
          <ResultCard label="Total Bill" value={formatCurrency(result.totalBill)} />
        </ResultsPanel>
      </div>
    </div>
  );
}
