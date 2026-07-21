'use client';

import { useState } from 'react';
import { calculateHomeEquityLoan } from '@/lib/calculators/home-equity-loan/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function HomeEquityLoanCalculator() {
  const [currentHomeValue, setCurrentHomeValue] = useState(450000);
  const [currentMortgageBalance, setCurrentMortgageBalance] = useState(280000);
  const [loanAmount, setLoanAmount] = useState(50000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTermYears, setLoanTermYears] = useState(10);
  const [maxCltvPct, setMaxCltvPct] = useState(85);

  const result = calculateHomeEquityLoan({
    currentHomeValue, currentMortgageBalance, loanAmount,
    interestRate, loanTermYears, maxCltvPct,
  });

  const equityPct = currentHomeValue > 0
    ? ((result.currentEquity / currentHomeValue) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Current Home Value ($)" htmlFor="hel-value">
            <input id="hel-value" type="number" value={currentHomeValue} min={0} step={5000}
              onChange={e => setCurrentHomeValue(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Current Mortgage Balance ($)" htmlFor="hel-balance">
            <input id="hel-balance" type="number" value={currentMortgageBalance} min={0} step={1000}
              onChange={e => setCurrentMortgageBalance(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Amount Requested ($)" htmlFor="hel-amount">
            <input id="hel-amount" type="number" value={loanAmount} min={0} step={1000}
              onChange={e => setLoanAmount(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="hel-rate">
            <input id="hel-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Term (years)" htmlFor="hel-term">
            <select id="hel-term" value={loanTermYears}
              onChange={e => setLoanTermYears(+e.target.value)} className={inputClass}>
              <option value={5}>5 years</option>
              <option value={10}>10 years</option>
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={30}>30 years</option>
            </select>
          </Field>
          <Field label="Max CLTV Allowed (%)" htmlFor="hel-cltv">
            <input id="hel-cltv" type="number" value={maxCltvPct} min={50} max={100} step={1}
              onChange={e => setMaxCltvPct(+e.target.value || 85)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Monthly Payment" value={formatCurrency(result.monthlyPayment)} />
          <ResultCard label="Current Home Equity"
            value={`${formatCurrency(result.currentEquity)} (${equityPct}%)`} />
          <ResultCard label="Max Loan Available" value={formatCurrency(result.maxLoanAvailable)} />
          <ResultCard label="Loan Amount" value={formatCurrency(result.loanAmount)} />
          <ResultCard label="CLTV After Loan"
            value={
              <span className={result.cltv > 90 ? 'text-amber-600 dark:text-amber-400' : ''}>
                {result.cltv.toFixed(1)}%
              </span>
            } />
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)} />
          <ResultCard label="Total Cost" value={formatCurrency(result.totalCost)} />
        </ResultsPanel>
      </div>

      {result.isOverLimit && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          ⚠ Requested amount exceeds the {maxCltvPct}% CLTV limit. Showing maximum available: {formatCurrency(result.maxLoanAvailable)}.
        </div>
      )}

      {/* Equity breakdown bar */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Home Value Breakdown</p>
        <div className="space-y-2 text-sm">
          {[
            { label: 'First Mortgage', value: currentMortgageBalance, color: 'bg-red-500' },
            { label: 'Equity Loan', value: result.loanAmount, color: 'bg-amber-500' },
            { label: 'Remaining Equity', value: Math.max(0, result.currentEquity - result.loanAmount), color: 'bg-green-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color.replace('bg-', '') }}
                aria-hidden="true" />
              <span className="w-36 shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${currentHomeValue > 0 ? Math.min(100, (value / currentHomeValue) * 100) : 0}%` }}
                />
              </div>
              <span className="w-24 text-right font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
