'use client';

import { useState } from 'react';
import { calculateMortgagePayoff } from '@/lib/calculators/mortgage-payoff/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function MortgagePayoffCalculator() {
  const [loanBalance, setLoanBalance] = useState(280000);
  const [interestRate, setInterestRate] = useState(6.85);
  const [monthlyPayment, setMonthlyPayment] = useState(1844);
  const [extraMonthly, setExtraMonthly] = useState(200);
  const [lumpSum, setLumpSum] = useState(0);

  const result = calculateMortgagePayoff({
    loanBalance,
    interestRate,
    monthlyPayment,
    extraMonthlyPayment: extraMonthly,
    lumpSumPayment: lumpSum,
  });

  const baseYears = (result.baseMonthsRemaining / 12).toFixed(1);
  const newYears = (result.newMonthsRemaining / 12).toFixed(1);
  const hasExtraPayment = extraMonthly > 0 || lumpSum > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Current Loan Balance ($)" htmlFor="mpo-balance">
            <input id="mpo-balance" type="number" value={loanBalance} min={0} step={1000}
              onChange={e => setLoanBalance(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="mpo-rate">
            <input id="mpo-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Regular Monthly Payment ($)" htmlFor="mpo-payment"
            hint="Principal & interest portion only (exclude taxes/insurance).">
            <input id="mpo-payment" type="number" value={monthlyPayment} min={1} step={10}
              onChange={e => setMonthlyPayment(+e.target.value || 1)} className={inputClass} />
          </Field>
          <Field label="Extra Monthly Payment ($)" htmlFor="mpo-extra"
            hint="Additional amount applied directly to principal each month.">
            <input id="mpo-extra" type="number" value={extraMonthly} min={0} step={50}
              onChange={e => setExtraMonthly(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="One-Time Lump Sum ($)" htmlFor="mpo-lump"
            hint="Applied to principal today (tax refund, bonus, etc.).">
            <input id="mpo-lump" type="number" value={lumpSum} min={0} step={500}
              onChange={e => setLumpSum(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          {hasExtraPayment ? (
            <>
              <ResultCard highlight label="Interest Saved" value={formatCurrency(result.interestSaved)} />
              <ResultCard label="Time Saved"
                value={`${result.yearsSaved} yrs`}
                sub={`${result.monthsSaved} months earlier payoff`} />
              <ResultCard label="New Payoff Date" value={result.newPayoffDate} />
              <ResultCard label="New Term Remaining" value={`${newYears} yrs`} />
              <ResultCard label="Original Payoff Date" value={result.basePayoffDate} />
              <ResultCard label="Total Monthly Payment" value={formatCurrency(result.newTotalMonthlyPayment)}
                sub={`${formatCurrency(extraMonthly)}/mo extra`} />
            </>
          ) : (
            <>
              <ResultCard highlight label="Payoff Date" value={result.basePayoffDate} />
              <ResultCard label="Months Remaining" value={`${result.baseMonthsRemaining} months`}
                sub={`≈ ${baseYears} years`} />
              <ResultCard label="Total Interest" value={formatCurrency(result.baseTotalInterest)} />
              <ResultCard label="Monthly Payment" value={formatCurrency(monthlyPayment)} />
            </>
          )}
        </ResultsPanel>
      </div>

      {/* Comparison bar */}
      {hasExtraPayment && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Payoff Timeline Comparison</p>

          <div className="space-y-3">
            {[
              { label: 'Without extra payments', months: result.baseMonthsRemaining, interest: result.baseTotalInterest, color: '#ef4444' },
              { label: `With ${formatCurrency(extraMonthly)}/mo extra${lumpSum > 0 ? ` + ${formatCurrency(lumpSum)} lump sum` : ''}`, months: result.newMonthsRemaining, interest: result.newTotalInterest, color: '#22c55e' },
            ].map(({ label, months, interest, color }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>{label}</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {(months / 12).toFixed(1)} yrs · {formatCurrency(interest)} interest
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(months / result.baseMonthsRemaining) * 100}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400 font-semibold">
            🎉 Extra payments save {formatCurrency(result.interestSaved)} in interest and pay off {result.yearsSaved} years earlier.
          </div>
        </div>
      )}

      {!hasExtraPayment && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
          💡 Try adding an extra monthly payment or lump sum above to see how much interest you can save and how much earlier you can pay off your mortgage.
        </div>
      )}
    </div>
  );
}
