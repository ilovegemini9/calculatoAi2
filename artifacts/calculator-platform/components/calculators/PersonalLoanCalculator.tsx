'use client';

import { useState } from 'react';
import { calculatePersonalLoan } from '@/lib/calculators/personal-loan/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

const TERM_OPTIONS = [12, 18, 24, 36, 48, 60, 72, 84];

export function PersonalLoanCalculator() {
  const [loanAmount, setLoanAmount]           = useState(15000);
  const [annualRate, setAnnualRate]           = useState(11.5);
  const [termMonths, setTermMonths]           = useState(36);
  const [originationFeePct, setOriginationFeePct] = useState(0);
  const [showFee, setShowFee]                 = useState(false);

  const result = calculatePersonalLoan({
    loanAmount, annualRate, termMonths,
    originationFeePct: showFee ? originationFeePct : 0,
  });

  // Amortization preview — yearly snapshots (every 12th payment)
  const previewRows = result.amortization.filter(
    r => r.paymentNumber % 12 === 0 || r.paymentNumber === 1 || r.paymentNumber === termMonths,
  );

  const costRatio = loanAmount > 0 ? (result.totalInterest / loanAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Loan Amount ($)" htmlFor="pl-amount">
            <input id="pl-amount" type="number" value={loanAmount} min={100} step={500}
              aria-label="Personal loan amount in dollars"
              onChange={e => setLoanAmount(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Annual Interest Rate (%)" htmlFor="pl-rate">
            <input id="pl-rate" type="number" value={annualRate} min={0} max={100} step={0.1}
              aria-label="Annual interest rate as a percentage"
              onChange={e => setAnnualRate(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Loan Term" htmlFor="pl-term">
            <select id="pl-term" value={termMonths} aria-label="Loan term in months"
              onChange={e => setTermMonths(+e.target.value)} className={selectClass}>
              {TERM_OPTIONS.map(m => (
                <option key={m} value={m}>{m} months ({(m / 12).toFixed(1).replace('.0', '')} {m === 12 ? 'year' : 'years'})</option>
              ))}
            </select>
          </Field>

          {/* Origination fee toggle */}
          <div>
            <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={showFee} onChange={e => setShowFee(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-600" aria-label="Include origination fee" />
              Include Origination Fee
            </label>
            {showFee && (
              <div className="mt-2">
                <input id="pl-fee" type="number" value={originationFeePct} min={0} max={10} step={0.1}
                  aria-label="Origination fee as a percentage of loan amount"
                  onChange={e => setOriginationFeePct(+e.target.value || 0)} className={inputClass}
                  placeholder="Fee % of loan amount" />
                {originationFeePct > 0 && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    = {formatCurrency(result.originationFee)} deducted at funding. You receive {formatCurrency(result.netProceeds)}.
                  </p>
                )}
              </div>
            )}
          </div>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Monthly Payment" value={formatCurrency(result.monthlyPayment)} />
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)}
            sub={`${costRatio.toFixed(1)}% of principal`} />
          <ResultCard label="Total Cost" value={formatCurrency(result.totalCost)} />
          {result.originationFee > 0 && (
            <ResultCard label="Origination Fee" value={formatCurrency(result.originationFee)}
              sub={`${originationFeePct}% of loan amount`} />
          )}
          <ResultCard label={result.originationFee > 0 ? 'True APR (with fees)' : 'Interest Rate'} value={`${result.apr.toFixed(2)}%`}
            sub={result.originationFee > 0 ? 'Effective annual cost incl. fees' : 'Nominal annual rate'} />
          <ResultCard label="Net Proceeds" value={formatCurrency(result.netProceeds)}
            sub="Amount deposited to your account" />
        </ResultsPanel>
      </div>

      {/* Amortization table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Amortization Snapshots
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Personal loan amortization schedule">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                  <th key={h} scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {previewRows.slice(0, 12).map(row => (
                <tr key={row.paymentNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-4 py-2.5 font-semibold text-slate-500">{row.paymentNumber}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-200">{formatCurrency(row.payment)}</td>
                  <td className="px-4 py-2.5 text-green-700 dark:text-green-400">{formatCurrency(row.principalPaid)}</td>
                  <td className="px-4 py-2.5 text-red-600 dark:text-red-400">{formatCurrency(row.interestPaid)}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
