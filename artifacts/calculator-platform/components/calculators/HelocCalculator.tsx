'use client';

import { useState } from 'react';
import { calculateHeloc } from '@/lib/calculators/heloc/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency, formatPercent } from '@/lib/utils';

export function HelocCalculator() {
  const [homeValue, setHomeValue] = useState(450000);
  const [mortgageBalance, setMortgageBalance] = useState(280000);
  const [creditLimitRequested, setCreditLimitRequested] = useState(60000);
  const [interestRate, setInterestRate] = useState(8.75);
  const [drawPeriodYears, setDrawPeriodYears] = useState(10);
  const [repaymentPeriodYears, setRepaymentPeriodYears] = useState(20);
  const [monthlyDraw, setMonthlyDraw] = useState(500);
  const [maxCltv, setMaxCltv] = useState(85);

  const result = calculateHeloc({
    currentHomeValue: homeValue,
    currentMortgageBalance: mortgageBalance,
    creditLimitRequested,
    interestRate,
    drawPeriodYears,
    repaymentPeriodYears,
    monthlyDraw,
    maxCltvPct: maxCltv,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Current Home Value ($)" htmlFor="heloc-home-value">
            <input id="heloc-home-value" type="number" value={homeValue} min={0} step={5000}
              aria-label="Current appraised home value"
              onChange={e => setHomeValue(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Current Mortgage Balance ($)" htmlFor="heloc-mortgage">
            <input id="heloc-mortgage" type="number" value={mortgageBalance} min={0} step={1000}
              aria-label="Remaining first mortgage balance"
              onChange={e => setMortgageBalance(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="HELOC Credit Limit Requested ($)" htmlFor="heloc-limit">
            <input id="heloc-limit" type="number" value={creditLimitRequested} min={0} step={5000}
              aria-label="HELOC credit limit you want to request"
              onChange={e => setCreditLimitRequested(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="heloc-rate"
            hint="HELOCs use variable rates, typically Prime + margin. Current Prime ~8.5%.">
            <input id="heloc-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              aria-label="Annual interest rate"
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Draw Period (years)" htmlFor="heloc-draw">
            <select id="heloc-draw" value={drawPeriodYears}
              onChange={e => setDrawPeriodYears(+e.target.value)} className={inputClass}>
              {[5, 7, 10].map(y => <option key={y} value={y}>{y} years</option>)}
            </select>
          </Field>
          <Field label="Repayment Period (years)" htmlFor="heloc-repay">
            <select id="heloc-repay" value={repaymentPeriodYears}
              onChange={e => setRepaymentPeriodYears(+e.target.value)} className={inputClass}>
              {[10, 15, 20].map(y => <option key={y} value={y}>{y} years</option>)}
            </select>
          </Field>
          <Field label="Avg Monthly Draw ($)" htmlFor="heloc-monthly-draw"
            hint="Estimated average amount you plan to draw each month.">
            <input id="heloc-monthly-draw" type="number" value={monthlyDraw} min={0} step={100}
              aria-label="Average monthly amount drawn"
              onChange={e => setMonthlyDraw(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Max CLTV Allowed (%)" htmlFor="heloc-cltv">
            <input id="heloc-cltv" type="number" value={maxCltv} min={50} max={100} step={1}
              aria-label="Maximum combined loan-to-value ratio allowed by lender"
              onChange={e => setMaxCltv(+e.target.value || 85)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Approved Credit Line" value={formatCurrency(result.approvedCreditLine)} />
          <ResultCard label="Current Home Equity" value={formatCurrency(result.currentEquity)} />
          <ResultCard label="Draw Period Monthly Interest" value={formatCurrency(result.drawPeriodMonthlyInterest)}
            sub="Interest-only on avg drawn balance" />
          <ResultCard label="Repayment Monthly Payment" value={formatCurrency(result.repaymentMonthlyPayment)}
            sub={`P&I over ${repaymentPeriodYears} years`} />
          <ResultCard label="CLTV After HELOC" value={formatPercent(result.cltv)} />
          <ResultCard label="Total Interest (est.)" value={formatCurrency(result.totalInterest)} />
        </ResultsPanel>
      </div>

      {result.isOverLimit && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          ⚠ Requested credit limit exceeds the {maxCltv}% CLTV cap. Maximum available: {formatCurrency(result.maxCreditLine)}.
        </div>
      )}

      {/* Phase timeline bar */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>HELOC Phases</p>
        <div className="flex gap-2 text-sm">
          <div
            className="flex items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-xs py-3 text-center"
            style={{ flex: drawPeriodYears }}>
            Draw Period<br /><span className="font-normal opacity-70">{drawPeriodYears} yrs · interest-only</span>
          </div>
          <div
            className="flex items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-semibold text-xs py-3 text-center"
            style={{ flex: repaymentPeriodYears }}>
            Repayment Period<br /><span className="font-normal opacity-70">{repaymentPeriodYears} yrs · P&I</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          {[
            { label: 'First Mortgage LTV', value: formatPercent(result.ltv) },
            { label: 'Combined LTV (CLTV)', value: formatPercent(result.cltv) },
            { label: 'Total Interest (Draw)', value: formatCurrency(result.totalInterestDraw) },
            { label: 'Total Interest (Repayment)', value: formatCurrency(result.totalInterestRepayment) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between border-b pb-1.5" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <span>{label}</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
