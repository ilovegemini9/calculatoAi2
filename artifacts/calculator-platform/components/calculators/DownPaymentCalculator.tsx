'use client';

import { useState } from 'react';
import { calculateDownPayment, type LoanType } from '@/lib/calculators/down-payment/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';
import { formatCurrency, formatPercent } from '@/lib/utils';

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  'conventional-20': 'Conventional (20% down)',
  'conventional-10': 'Conventional (10% down)',
  'conventional-5':  'Conventional (5% down)',
  'fha':             'FHA Loan (3.5% down)',
  'va':              'VA Loan (0% down)',
  'usda':            'USDA Loan (0% down)',
  'custom':          'Custom percentage',
};

export function DownPaymentCalculator() {
  const [homePrice, setHomePrice] = useState(400000);
  const [loanType, setLoanType] = useState<LoanType>('conventional-20');
  const [customDownPct, setCustomDownPct] = useState(15);
  const [currentSavings, setCurrentSavings] = useState(30000);
  const [monthlySavings, setMonthlySavings] = useState(1500);
  const [savingsYield, setSavingsYield] = useState(4.5);
  const [closingCostPct, setClosingCostPct] = useState(3);

  const result = calculateDownPayment({
    homePrice, loanType, customDownPct, currentSavings,
    monthlySavings, savingsYield, closingCostPct,
  });

  const savingsProgress = result.totalCashNeeded > 0
    ? Math.min(100, (currentSavings / result.totalCashNeeded) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Home Price ($)" htmlFor="dp-price">
            <input id="dp-price" type="number" value={homePrice} min={0} step={5000}
              onChange={e => setHomePrice(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Type" htmlFor="dp-type">
            <select id="dp-type" value={loanType}
              onChange={e => setLoanType(e.target.value as LoanType)} className={selectClass}>
              {(Object.keys(LOAN_TYPE_LABELS) as LoanType[]).map(k => (
                <option key={k} value={k}>{LOAN_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </Field>
          {loanType === 'custom' && (
            <Field label="Custom Down Payment (%)" htmlFor="dp-custom-pct">
              <input id="dp-custom-pct" type="number" value={customDownPct} min={0} max={100} step={0.5}
                onChange={e => setCustomDownPct(+e.target.value || 0)} className={inputClass} />
            </Field>
          )}
          <Field label="Current Savings ($)" htmlFor="dp-savings">
            <input id="dp-savings" type="number" value={currentSavings} min={0} step={500}
              onChange={e => setCurrentSavings(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Monthly Savings ($)" htmlFor="dp-monthly">
            <input id="dp-monthly" type="number" value={monthlySavings} min={0} step={100}
              onChange={e => setMonthlySavings(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Savings Account Yield (%/yr)" htmlFor="dp-yield"
            hint="Interest earned on your savings (HYSA, CD, etc.)">
            <input id="dp-yield" type="number" value={savingsYield} min={0} max={20} step={0.1}
              onChange={e => setSavingsYield(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Closing Cost Estimate (%)" htmlFor="dp-closing"
            hint="Typically 2–5% of purchase price. Includes lender fees, title, escrow.">
            <input id="dp-closing" type="number" value={closingCostPct} min={0} max={10} step={0.25}
              onChange={e => setClosingCostPct(+e.target.value || 3)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Down Payment Needed"
            value={`${formatCurrency(result.downPaymentAmount)} (${formatPercent(result.downPaymentPct)})`} />
          <ResultCard label="Closing Costs"
            value={formatCurrency(result.closingCostAmount)}
            sub={`${formatPercent(result.closingCostPct)} of purchase price`} />
          <ResultCard label="Total Cash Needed" value={formatCurrency(result.totalCashNeeded)} />
          <ResultCard label="Still Need to Save" value={formatCurrency(result.cashGap)} />
          {result.requiresPmi && (
            <ResultCard label="Est. Monthly PMI" value={formatCurrency(result.estimatedMonthlyPmi)}
              sub="Removed when equity reaches 20%" />
          )}
          <ResultCard label="Loan Amount" value={formatCurrency(result.loanAmount)}
            sub={`${formatPercent(result.ltv)} LTV`} />
          {result.monthsToGoal !== null && (
            <ResultCard label="Months to Goal" value={`${result.monthsToGoal} months`}
              sub={result.targetDate ? `Ready ~${result.targetDate}` : ''} />
          )}
          {result.monthsToGoal === null && result.cashGap <= 0 && (
            <ResultCard label="Savings Status" value="Ready Now! 🎉"
              sub="You have enough for down payment + closing costs" />
          )}
        </ResultsPanel>
      </div>

      {/* Savings progress bar */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          <span>Savings Progress</span>
          <span>{savingsProgress.toFixed(0)}%</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${savingsProgress}%`,
              backgroundColor: savingsProgress >= 100 ? '#22c55e' : savingsProgress >= 50 ? '#3b82f6' : '#f59e0b',
            }}
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>Current: {formatCurrency(currentSavings)}</span>
          <span>Goal: {formatCurrency(result.totalCashNeeded)}</span>
        </div>

        {result.requiresPmi && (
          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            ⚠ PMI required — your down payment is below 20%. PMI adds ~{formatCurrency(result.estimatedMonthlyPmi)}/month until
            you reach 20% equity. Conventional loans: you can request PMI removal at 20% equity; it auto-cancels at 22%.
          </div>
        )}
        {(loanType === 'va' || loanType === 'usda') && (
          <div className="mt-2 rounded-lg border border-green-500/30 bg-green-50 dark:bg-green-950/30 px-3 py-2 text-xs text-green-700 dark:text-green-400">
            ✓ {loanType === 'va' ? 'VA' : 'USDA'} loans require no down payment and no PMI — significant savings versus conventional financing.
          </div>
        )}
      </div>
    </div>
  );
}
