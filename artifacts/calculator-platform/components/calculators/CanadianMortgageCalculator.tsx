'use client';

import { useState } from 'react';
import { calculateCanadianMortgage } from '@/lib/calculators/canadian-mortgage/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function CanadianMortgageCalculator() {
  const [homePrice, setHomePrice]               = useState(650000);
  const [downPayment, setDownPayment]           = useState(130000);
  const [annualRate, setAnnualRate]             = useState(5.25);
  const [amortizationYears, setAmortizationYears] = useState(25);
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'bi-weekly' | 'accelerated-bi-weekly'>('monthly');
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(4800);
  const [condoFeeMonthly, setCondoFeeMonthly]   = useState(0);

  const result = calculateCanadianMortgage({
    homePrice, downPayment, annualRate, amortizationYears,
    paymentFrequency, propertyTaxAnnual, condoFeeMonthly,
  });

  const freqLabel = paymentFrequency === 'monthly' ? 'Monthly' : paymentFrequency === 'bi-weekly' ? 'Bi-Weekly' : 'Accel. Bi-Weekly';
  const downPct = result.downPaymentPct;

  // Amortization preview — show every 12th payment (annual) or first
  const annualRows = result.amortization.filter(
    (r) => r.paymentNumber % (paymentFrequency === 'monthly' ? 12 : 26) === 0 || r.paymentNumber === 1,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Home Price (CAD $)" htmlFor="ca-home-price">
            <input id="ca-home-price" type="number" value={homePrice} min={0} step={5000}
              aria-label="Home price in Canadian dollars"
              onChange={e => setHomePrice(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label={`Down Payment (CAD $) — ${downPct}%`} htmlFor="ca-down">
            <input id="ca-down" type="number" value={downPayment} min={0} step={5000}
              aria-label={`Down payment, currently ${downPct}% of home price`}
              onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Annual Interest Rate (%)" htmlFor="ca-rate"
            hint="Canadian mortgages compound semi-annually by law.">
            <input id="ca-rate" type="number" value={annualRate} min={0} max={30} step={0.01}
              aria-label="Annual interest rate as a percentage"
              onChange={e => setAnnualRate(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Amortization Period (years)" htmlFor="ca-amort">
            <input id="ca-amort" type="number" value={amortizationYears} min={5} max={30}
              aria-label="Amortization period in years"
              onChange={e => setAmortizationYears(Math.min(30, Math.max(5, +e.target.value || 25)))} className={inputClass} />
          </Field>

          <Field label="Payment Frequency" htmlFor="ca-freq">
            <select id="ca-freq" value={paymentFrequency} aria-label="Payment frequency"
              onChange={e => setPaymentFrequency(e.target.value as typeof paymentFrequency)} className={selectClass}>
              <option value="monthly">Monthly</option>
              <option value="bi-weekly">Bi-Weekly (26 payments/yr)</option>
              <option value="accelerated-bi-weekly">Accelerated Bi-Weekly</option>
            </select>
          </Field>

          <Field label="Property Tax (CAD $/yr)" htmlFor="ca-tax">
            <input id="ca-tax" type="number" value={propertyTaxAnnual} min={0} step={100}
              aria-label="Annual property tax in Canadian dollars"
              onChange={e => setPropertyTaxAnnual(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Condo / Strata Fee (CAD $/mo)" htmlFor="ca-condo">
            <input id="ca-condo" type="number" value={condoFeeMonthly} min={0} step={25}
              aria-label="Monthly condo or strata fee in Canadian dollars"
              onChange={e => setCondoFeeMonthly(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label={`${freqLabel} Payment`} value={formatCurrency(result.periodicPayment)} />
          <ResultCard label="Total Monthly Outlay" value={formatCurrency(result.totalMonthlyOutlay)}
            sub="P&I (equiv.) + tax + condo" />
          <ResultCard label="Total Mortgage" value={formatCurrency(result.totalMortgage)}
            sub={result.cmhcPremium > 0 ? `Incl. CMHC ${(result.cmhcRate * 100).toFixed(1)}% (${formatCurrency(result.cmhcPremium)})` : 'No CMHC required'} />
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)} />
          <ResultCard label="Total Cost" value={formatCurrency(result.totalCost)} />
          {result.cmhcPremium > 0 && (
            <ResultCard label="CMHC Premium" value={formatCurrency(result.cmhcPremium)}
              sub={`${(result.cmhcRate * 100).toFixed(1)}% of mortgage — added to principal`} />
          )}
          <ResultCard label="Effective Monthly Rate"
            value={`${(result.effectiveMonthlyRate * 100).toFixed(5)}%`}
            sub="Semi-annual compounding per Interest Act" />
        </ResultsPanel>
      </div>

      {/* CMHC notice */}
      {downPct < 20 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <strong>CMHC Mortgage Insurance required</strong> — down payment under 20%. A{' '}
          {(result.cmhcRate * 100).toFixed(1)}% premium ({formatCurrency(result.cmhcPremium)}) is added to
          your mortgage principal and amortized over the full period.
          {downPct < 5 && ' Minimum 5% down payment required for insured mortgages.'}
        </div>
      )}

      {/* Amortization schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
            Amortization Schedule (annual snapshots)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Amortization schedule">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                {['Payment #', 'Payment', 'Principal', 'Interest', 'Balance'].map(h => (
                  <th key={h} scope="col" className="text-left px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {annualRows.slice(0, 15).map(row => (
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
