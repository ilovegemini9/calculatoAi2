'use client';

import { useState } from 'react';
import { calculateAutoLoan } from '@/lib/calculators/auto-loan/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

const TERM_OPTIONS = [24, 36, 48, 60, 72, 84];

export function AutoLoanCalculator() {
  const [vehiclePrice, setVehiclePrice]   = useState(35000);
  const [downPayment, setDownPayment]     = useState(5000);
  const [tradeInValue, setTradeInValue]   = useState(0);
  const [salesTaxRate, setSalesTaxRate]   = useState(8.0);
  const [dealerFees, setDealerFees]       = useState(800);
  const [annualRate, setAnnualRate]       = useState(6.9);
  const [termMonths, setTermMonths]       = useState(60);

  const result = calculateAutoLoan({
    vehiclePrice, downPayment, tradeInValue,
    salesTaxRate, dealerFees, annualRate, termMonths,
  });

  // Annual amortization snapshots
  const annualRows = result.amortization.filter(
    r => r.paymentNumber % 12 === 0 || r.paymentNumber === 1 || r.paymentNumber === termMonths,
  );

  const financeRatio = result.amountFinanced > 0
    ? (result.totalInterest / result.amountFinanced) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Vehicle Price ($)" htmlFor="al-price">
            <input id="al-price" type="number" value={vehiclePrice} min={0} step={500}
              aria-label="Vehicle selling price in dollars"
              onChange={e => setVehiclePrice(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Down Payment ($)" htmlFor="al-down">
            <input id="al-down" type="number" value={downPayment} min={0} step={500}
              aria-label="Down payment in dollars"
              onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Trade-In Value ($)" htmlFor="al-tradein">
            <input id="al-tradein" type="number" value={tradeInValue} min={0} step={500}
              aria-label="Trade-in vehicle value in dollars"
              onChange={e => setTradeInValue(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Sales Tax Rate (%)" htmlFor="al-tax">
            <input id="al-tax" type="number" value={salesTaxRate} min={0} max={20} step={0.1}
              aria-label="Sales tax rate as a percentage"
              onChange={e => setSalesTaxRate(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Dealer / Doc Fees ($)" htmlFor="al-fees"
            hint="Documentation, title, registration fees">
            <input id="al-fees" type="number" value={dealerFees} min={0} step={50}
              aria-label="Dealer and documentation fees in dollars"
              onChange={e => setDealerFees(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="APR (%)" htmlFor="al-rate">
            <input id="al-rate" type="number" value={annualRate} min={0} max={30} step={0.1}
              aria-label="Annual percentage rate"
              onChange={e => setAnnualRate(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Loan Term" htmlFor="al-term">
            <select id="al-term" value={termMonths} aria-label="Loan term in months"
              onChange={e => setTermMonths(+e.target.value)} className={selectClass}>
              {TERM_OPTIONS.map(m => (
                <option key={m} value={m}>{m} months ({m / 12} years)</option>
              ))}
            </select>
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Monthly Payment" value={formatCurrency(result.monthlyPayment)} />
          <ResultCard label="Amount Financed" value={formatCurrency(result.amountFinanced)}
            sub="After down + trade-in + tax + fees" />
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)}
            sub={`${financeRatio.toFixed(1)}% of financed amount`} />
          <ResultCard label="Total Loan Cost" value={formatCurrency(result.totalLoanCost)}
            sub="Financed amount + interest" />
          <ResultCard label="Sales Tax" value={formatCurrency(result.taxAmount)}
            sub={`${salesTaxRate}% on taxable base`} />
          <ResultCard label="Total Out-of-Pocket" value={formatCurrency(result.totalOutOfPocket)}
            sub="Down payment + all monthly payments" />
        </ResultsPanel>
      </div>

      {/* Cost summary bar */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 p-4 border-slate-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Cost Breakdown</p>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex-wrap">
          <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1">
            Vehicle {formatCurrency(result.vehiclePrice)}
          </span>
          <span className="text-slate-400">+</span>
          <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-1">
            Tax {formatCurrency(result.taxAmount)}
          </span>
          <span className="text-slate-400">+</span>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1">
            Fees {formatCurrency(dealerFees)}
          </span>
          <span className="text-slate-400">−</span>
          <span className="rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1">
            Down {formatCurrency(downPayment)}
          </span>
          {tradeInValue > 0 && <>
            <span className="text-slate-400">−</span>
            <span className="rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1">
              Trade-In {formatCurrency(tradeInValue)}
            </span>
          </>}
          <span className="text-slate-400">=</span>
          <span className="rounded-full bg-blue-600 text-white px-2.5 py-1">
            Financed {formatCurrency(result.amountFinanced)}
          </span>
        </div>
      </div>

      {/* Amortization table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Amortization Schedule (annual)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Auto loan amortization schedule">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                {['Month', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                  <th key={h} scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {annualRows.map(row => (
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
