'use client';

import React, { useState } from 'react';
import { calculateMortgageAmortization } from '@/lib/calculators/mortgage-amortization/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function MortgageAmortizationCalculator() {
  const [loanAmount, setLoanAmount] = useState(320000);
  const [interestRate, setInterestRate] = useState(6.85);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(0);
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  const result = calculateMortgageAmortization({
    loanAmount,
    interestRate,
    loanTermYears,
    extraMonthlyPayment,
  });

  const payoffYears = Math.floor(result.payoffMonths / 12);
  const payoffMonthsRem = result.payoffMonths % 12;

  return (
    <div className="space-y-6">
      {/* Inputs + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Loan Amount ($)" htmlFor="amort-loan">
            <input id="amort-loan" type="number" value={loanAmount} min={0} step={1000}
              aria-label="Total loan amount in dollars"
              onChange={e => setLoanAmount(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="amort-rate">
            <input id="amort-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              aria-label="Annual interest rate as a percentage"
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Term (years)" htmlFor="amort-term">
            <input id="amort-term" type="number" value={loanTermYears} min={1} max={30}
              aria-label="Loan term in years"
              onChange={e => setLoanTermYears(+e.target.value || 30)} className={inputClass} />
          </Field>
          <Field label="Extra Monthly Payment ($)" htmlFor="amort-extra"
            hint="Additional principal payment per month to pay off the loan faster.">
            <input id="amort-extra" type="number" value={extraMonthlyPayment} min={0} step={50}
              aria-label="Extra monthly principal payment in dollars"
              onChange={e => setExtraMonthlyPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Monthly Payment (P&I)" value={formatCurrency(result.monthlyPayment)} />
          {extraMonthlyPayment > 0 && (
            <ResultCard highlight label="Total Monthly (+ Extra)" value={formatCurrency(result.totalMonthlyPayment)} />
          )}
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)} />
          <ResultCard label="Total Amount Paid" value={formatCurrency(result.totalPaid)} />
          <ResultCard
            label="Payoff Time"
            value={payoffYears > 0 ? `${payoffYears}y ${payoffMonthsRem}m` : `${result.payoffMonths}mo`}
          />
          {extraMonthlyPayment > 0 && result.interestSaved > 0 && (
            <>
              <ResultCard label="Interest Saved" value={formatCurrency(result.interestSaved)}
                sub="vs no extra payments" />
              <ResultCard label="Months Saved" value={`${result.monthsSaved} mo`}
                sub="vs no extra payments" />
            </>
          )}
        </ResultsPanel>
      </div>

      {/* Schedule toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          View Schedule:
        </span>
        {(['yearly', 'monthly'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            aria-pressed={viewMode === mode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'border text-slate-500 hover:text-blue-500'
            }`}
            style={viewMode !== mode ? { borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' } : undefined}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Yearly summary table */}
      {viewMode === 'yearly' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b flex items-center justify-between"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Year-by-Year Summary
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Click a row to expand monthly detail</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" role="table" aria-label="Yearly amortization summary">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                  {['Year', 'Principal', 'Interest', 'Total Paid', 'Balance', 'Cum. Interest'].map(h => (
                    <th key={h} scope="col"
                      className="px-4 py-2.5 text-left font-black uppercase tracking-wider text-[10px]"
                      style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {result.yearlySummary.map(row => (
                  <React.Fragment key={row.year}>
                    <tr
                      onClick={() => setExpandedYear(expandedYear === row.year ? null : row.year)}
                      className="cursor-pointer transition-colors hover:bg-[var(--bg-card-hover)]"
                      style={{ borderColor: 'var(--border)' }}
                      aria-expanded={expandedYear === row.year}
                    >
                      <td className="px-4 py-2.5 font-bold text-blue-500">
                        {row.year} {expandedYear === row.year ? '▲' : '▼'}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(row.totalPrincipal)}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(row.totalInterest)}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(row.totalPayment)}
                      </td>
                      <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(row.endingBalance)}
                      </td>
                      <td className="px-4 py-2.5 text-amber-600 dark:text-amber-400">
                        {formatCurrency(row.cumulativeInterest)}
                      </td>
                    </tr>
                    {expandedYear === row.year && (
                      <tr key={`${row.year}-detail`}>
                        <td colSpan={6} className="p-0">
                          <div className="overflow-x-auto border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                            <table className="w-full text-[11px]" aria-label={`Monthly detail for year ${row.year}`}>
                              <thead>
                                <tr>
                                  {['Mo', 'Payment', 'Principal', 'Interest', 'Extra', 'Balance'].map(h => (
                                    <th key={h} scope="col" className="px-3 py-2 text-left font-black uppercase tracking-wider text-[9px]"
                                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {result.schedule
                                  .filter(r => r.year === row.year)
                                  .map(r => (
                                    <tr key={r.month} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                      <td className="px-3 py-1.5 text-blue-500 font-bold">{r.month}</td>
                                      <td className="px-3 py-1.5" style={{ color: 'var(--text-primary)' }}>{formatCurrency(r.payment)}</td>
                                      <td className="px-3 py-1.5" style={{ color: 'var(--text-primary)' }}>{formatCurrency(r.principal)}</td>
                                      <td className="px-3 py-1.5" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.interest)}</td>
                                      <td className="px-3 py-1.5" style={{ color: 'var(--text-muted)' }}>{r.extraPrincipal > 0 ? formatCurrency(r.extraPrincipal) : '—'}</td>
                                      <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.balance)}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full monthly table */}
      {viewMode === 'monthly' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Full Monthly Schedule — {result.payoffMonths} payments
            </p>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-xs" role="table" aria-label="Full monthly amortization schedule">
              <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-input)' }}>
                <tr>
                  {['Mo', 'Year', 'Payment', 'Principal', 'Interest', 'Balance', 'Cum. Interest'].map(h => (
                    <th key={h} scope="col"
                      className="px-4 py-2.5 text-left font-black uppercase tracking-wider text-[10px] border-b"
                      style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {result.schedule.map(r => (
                  <tr key={r.month} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-4 py-2 font-bold text-blue-500">{r.month}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-muted)' }}>{r.year}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{formatCurrency(r.payment)}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>{formatCurrency(r.principal)}</td>
                    <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.interest)}</td>
                    <td className="px-4 py-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.balance)}</td>
                    <td className="px-4 py-2 text-amber-600 dark:text-amber-400">{formatCurrency(r.cumulativeInterest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.payoffMonths > 120 && (
            <p className="px-5 py-3 text-[10px] border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              Showing all {formatNumber(result.payoffMonths, 0)} payments. Use Yearly view for a condensed summary.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
