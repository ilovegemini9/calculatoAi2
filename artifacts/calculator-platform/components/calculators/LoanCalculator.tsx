'use client';

import { useState } from 'react';
import { calculateLoan } from '@/lib/calculators/loan/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function LoanCalculator() {
  const [loanAmount, setLoanAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [term, setTerm] = useState(5);
  const [termUnit, setTermUnit] = useState<'years' | 'months'>('years');

  const result = calculateLoan({ loanAmount, interestRate, term, termUnit });

  const yearlyRows = result.amortization.filter(r => r.paymentNumber % 12 === 0 || r.paymentNumber === 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Loan Amount ($)" htmlFor="loan-amount">
            <input
              id="loan-amount"
              type="number"
              value={loanAmount}
              min={0}
              step={100}
              aria-label="Loan amount in dollars"
              onChange={e => setLoanAmount(+e.target.value || 0)}
              className={inputClass}
            />
          </Field>
          <Field label="Annual Interest Rate (%)" htmlFor="loan-rate">
            <input
              id="loan-rate"
              type="number"
              value={interestRate}
              min={0}
              max={100}
              step={0.01}
              aria-label="Annual interest rate as a percentage"
              onChange={e => setInterestRate(+e.target.value || 0)}
              className={inputClass}
            />
          </Field>
          <div className="flex gap-3">
            <Field label="Term" htmlFor="loan-term">
              <input
                id="loan-term"
                type="number"
                value={term}
                min={1}
                aria-label="Loan term duration"
                onChange={e => setTerm(+e.target.value || 1)}
                className={inputClass}
              />
            </Field>
            <Field label="Unit" htmlFor="loan-term-unit">
              <select
                id="loan-term-unit"
                value={termUnit}
                aria-label="Loan term unit"
                onChange={e => setTermUnit(e.target.value as 'years' | 'months')}
                className={selectClass}
              >
                <option value="years">Years</option>
                <option value="months">Months</option>
              </select>
            </Field>
          </div>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Monthly Payment" value={formatCurrency(result.monthlyPayment)} />
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)} />
          <ResultCard label="Total Cost" value={formatCurrency(result.totalCost)} />
          <ResultCard label="Principal" value={formatCurrency(result.totalPrincipal)} />
        </ResultsPanel>
      </div>

      {/* Amortization preview */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Amortization Schedule (key payments)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Amortization schedule">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['#', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                  <th key={h} scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {yearlyRows.slice(0, 12).map(row => (
                <tr key={row.paymentNumber} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-2.5 font-semibold text-slate-500">{row.paymentNumber}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-800">{formatCurrency(row.payment)}</td>
                  <td className="px-4 py-2.5 text-green-700">{formatCurrency(row.principalPaid)}</td>
                  <td className="px-4 py-2.5 text-red-600">{formatCurrency(row.interestPaid)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{formatCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
