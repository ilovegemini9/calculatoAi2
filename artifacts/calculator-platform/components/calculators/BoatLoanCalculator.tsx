'use client';

import { useMemo, useState } from 'react';
import { calculateBoatLoan } from '@/lib/calculators/boat-loan/formula';
import { formatCurrency } from '@/lib/utils';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

export function BoatLoanCalculator() {
  const [boatPrice, setBoatPrice] = useState(65000);
  const [downPayment, setDownPayment] = useState(10000);
  const [tradeInValue, setTradeInValue] = useState(0);
  const [salesTaxRate, setSalesTaxRate] = useState(6.5);
  const [fees, setFees] = useState(1500);
  const [interestRate, setInterestRate] = useState(7.25);
  const [termYears, setTermYears] = useState(10);

  const result = useMemo(() => calculateBoatLoan({ boatPrice, downPayment, tradeInValue, salesTaxRate, fees, interestRate, termYears }), [boatPrice, downPayment, tradeInValue, salesTaxRate, fees, interestRate, termYears]);
  const principalShare = result.totalPayments > 0 ? (result.amountFinanced / result.totalPayments) * 100 : 0;
  const interestShare = 100 - principalShare;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel title="Boat Loan Inputs">
          <Field label="Boat Price ($)" htmlFor="boat-price" hint="Purchase price before financing costs.">
            <input id="boat-price" type="number" value={boatPrice} min={0} max={10000000} step={500} aria-label="Boat price in dollars" onChange={(e) => setBoatPrice(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Down Payment ($)" htmlFor="boat-down-payment">
            <input id="boat-down-payment" type="number" value={downPayment} min={0} max={10000000} step={100} aria-label="Boat down payment in dollars" onChange={(e) => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Trade-In Value ($)" htmlFor="boat-trade-in">
            <input id="boat-trade-in" type="number" value={tradeInValue} min={0} max={10000000} step={100} aria-label="Boat trade in value in dollars" onChange={(e) => setTradeInValue(+e.target.value || 0)} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sales Tax (%)" htmlFor="boat-tax">
              <input id="boat-tax" type="number" value={salesTaxRate} min={0} max={100} step={0.01} aria-label="Boat sales tax rate" onChange={(e) => setSalesTaxRate(+e.target.value || 0)} className={inputClass} />
            </Field>
            <Field label="Fees ($)" htmlFor="boat-fees">
              <input id="boat-fees" type="number" value={fees} min={0} max={1000000} step={50} aria-label="Boat loan fees" onChange={(e) => setFees(+e.target.value || 0)} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interest Rate (%)" htmlFor="boat-rate">
              <input id="boat-rate" type="number" value={interestRate} min={0} max={100} step={0.01} aria-label="Boat loan annual interest rate" onChange={(e) => setInterestRate(+e.target.value || 0)} className={inputClass} />
            </Field>
            <Field label="Term (years)" htmlFor="boat-term">
              <input id="boat-term" type="number" value={termYears} min={1} max={50} step={1} aria-label="Boat loan term in years" onChange={(e) => setTermYears(+e.target.value || 1)} className={inputClass} />
            </Field>
          </div>
        </InputsPanel>

        <ResultsPanel title="Live Boat Loan Results">
          <ResultCard highlight label="Monthly Payment" value={formatCurrency(result.monthlyPayment)} sub={`${result.termMonths} monthly payments`} />
          <ResultCard label="Amount Financed" value={formatCurrency(result.amountFinanced)} sub={`Taxable price ${formatCurrency(result.taxablePrice)}`} />
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)} />
          <ResultCard label="Total Cost" value={formatCurrency(result.totalCost)} sub={`Upfront ${formatCurrency(result.upfrontCash)}`} />
          <div className="sm:col-span-2 space-y-2" aria-label="Principal and interest split">
            <div className="flex justify-between text-[11px] text-slate-400"><span>Principal {principalShare.toFixed(1)}%</span><span>Interest {interestShare.toFixed(1)}%</span></div>
            <div className="h-3 rounded-full overflow-hidden bg-red-500/30 flex"><div className="bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, principalShare))}%` }} /><div className="bg-red-400 flex-1" /></div>
          </div>
          {interestRate === 0 && <p className="sm:col-span-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">0% interest selected: total interest is $0 and payments are evenly divided.</p>}
        </ResultsPanel>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}><h3 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Annual Amortization Snapshot</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-xs" aria-label="Boat loan amortization schedule"><thead><tr style={{ backgroundColor: 'var(--bg-input)' }}>{['Year', 'Payment', 'Principal', 'Interest', 'Balance'].map((h) => <th key={h} scope="col" className="text-left px-4 py-3 font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>)}</tr></thead><tbody>{result.amortization.slice(0, 12).map((row) => <tr key={row.year} className="border-t" style={{ borderColor: 'var(--border)' }}><td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>{row.year}</td><td className="px-4 py-3 font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.payment)}</td><td className="px-4 py-3 text-green-600">{formatCurrency(row.principalPaid)}</td><td className="px-4 py-3 text-red-500">{formatCurrency(row.interestPaid)}</td><td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.balance)}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}
