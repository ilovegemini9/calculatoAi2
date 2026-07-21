'use client';

import { useState } from 'react';
import { calculateRefinance } from '@/lib/calculators/refinance/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function RefinanceCalculator() {
  const [currentBalance, setCurrentBalance] = useState(320000);
  const [currentRate, setCurrentRate] = useState(7.25);
  const [currentPayment, setCurrentPayment] = useState(2183);
  const [remainingMonths, setRemainingMonths] = useState(312); // 26 years
  const [newRate, setNewRate] = useState(6.25);
  const [newTermYears, setNewTermYears] = useState(30);
  const [closingCosts, setClosingCosts] = useState(6000);
  const [rollClosingCosts, setRollClosingCosts] = useState(false);

  const result = calculateRefinance({
    currentLoanBalance: currentBalance,
    currentInterestRate: currentRate,
    currentMonthlyPayment: currentPayment,
    currentRemainingTermMonths: remainingMonths,
    newInterestRate: newRate,
    newLoanTermYears: newTermYears,
    closingCostAmount: closingCosts,
    rollClosingCosts,
  });

  const savingsPositive = result.monthlySavings > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel title="Current & New Loan Details">
          <p className="text-[10px] font-bold uppercase tracking-wider -mb-2" style={{ color: 'var(--text-muted)' }}>— Current Loan —</p>
          <Field label="Remaining Balance ($)" htmlFor="refi-balance">
            <input id="refi-balance" type="number" value={currentBalance} min={0} step={1000}
              onChange={e => setCurrentBalance(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Current Interest Rate (%)" htmlFor="refi-cur-rate">
            <input id="refi-cur-rate" type="number" value={currentRate} min={0} max={30} step={0.01}
              onChange={e => setCurrentRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Current Monthly Payment (P&I)" htmlFor="refi-cur-payment">
            <input id="refi-cur-payment" type="number" value={currentPayment} min={0} step={10}
              onChange={e => setCurrentPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Months Remaining" htmlFor="refi-remaining"
            hint={`= ${(remainingMonths / 12).toFixed(1)} years left`}>
            <input id="refi-remaining" type="number" value={remainingMonths} min={1} max={360} step={1}
              onChange={e => setRemainingMonths(+e.target.value || 1)} className={inputClass} />
          </Field>

          <p className="text-[10px] font-bold uppercase tracking-wider -mb-2 pt-2 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>— New Loan —</p>
          <Field label="New Interest Rate (%)" htmlFor="refi-new-rate">
            <input id="refi-new-rate" type="number" value={newRate} min={0} max={30} step={0.01}
              onChange={e => setNewRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="New Loan Term (years)" htmlFor="refi-new-term">
            <select id="refi-new-term" value={newTermYears}
              onChange={e => setNewTermYears(+e.target.value)} className={selectClass}>
              {[10, 15, 20, 25, 30].map(y => <option key={y} value={y}>{y} years</option>)}
            </select>
          </Field>
          <Field label="Closing Costs ($)" htmlFor="refi-closing"
            hint="Typically 2–5% of loan amount. Includes origination, appraisal, title.">
            <input id="refi-closing" type="number" value={closingCosts} min={0} step={250}
              onChange={e => setClosingCosts(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Roll Closing Costs into Loan?" htmlFor="refi-roll">
            <select id="refi-roll" value={rollClosingCosts ? 'yes' : 'no'}
              onChange={e => setRollClosingCosts(e.target.value === 'yes')} className={selectClass}>
              <option value="no">No — pay upfront</option>
              <option value="yes">Yes — add to new loan</option>
            </select>
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="New Monthly Payment" value={formatCurrency(result.newMonthlyPayment)} />
          <ResultCard
            label="Monthly Change"
            value={
              <span className={result.monthlyPaymentChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                {result.monthlyPaymentChange >= 0 ? '−' : '+'}{formatCurrency(Math.abs(result.monthlyPaymentChange))}
              </span>
            }
            sub={savingsPositive ? 'savings per month' : 'increase per month'}
          />
          <ResultCard
            label="Break-Even Point"
            value={result.breakEvenMonths !== null ? `${result.breakEvenMonths} months` : 'N/A'}
            sub={result.breakEvenYears !== null ? `≈ ${result.breakEvenYears} years` : 'No monthly savings'}
          />
          <ResultCard
            label="Lifetime Interest Savings"
            value={
              <span className={result.lifetimeInterestSavings >= 0 ? 'text-green-400' : 'text-red-400'}>
                {formatCurrency(Math.abs(result.lifetimeInterestSavings))}
              </span>
            }
            sub={result.lifetimeInterestSavings >= 0 ? 'saved' : 'more in interest (longer term)'}
          />
          <ResultCard label="Current Remaining Interest" value={formatCurrency(result.remainingInterestCurrent)} />
          <ResultCard label="New Total Interest" value={formatCurrency(result.totalInterestNew)} />
        </ResultsPanel>
      </div>

      {/* Warning banners */}
      {result.rateIncrease && (
        <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          ⚠ Your new rate ({newRate}%) is higher than your current rate ({currentRate}%). Refinancing will increase your monthly payment and total interest paid.
        </div>
      )}
      {result.termExtended && !result.rateIncrease && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          ℹ You&apos;re extending your term beyond the current payoff date ({(remainingMonths / 12).toFixed(1)} yrs remaining → {newTermYears} yrs new). Monthly savings may be offset by additional interest over the longer timeline.
        </div>
      )}

      {/* Side-by-side summary */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Current Loan', payment: currentPayment, interest: result.remainingInterestCurrent, months: remainingMonths },
          { label: 'Refinanced Loan', payment: result.newMonthlyPayment, interest: result.totalInterestNew, months: newTermYears * 12 },
        ].map(({ label, payment, interest, months }) => (
          <div key={label} className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{formatCurrency(payment)}<span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>/mo</span></p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total interest: {formatCurrency(interest)}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Term: {(months / 12).toFixed(1)} yrs</p>
          </div>
        ))}
      </div>
    </div>
  );
}
