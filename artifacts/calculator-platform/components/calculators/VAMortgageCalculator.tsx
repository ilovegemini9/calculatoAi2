'use client';

import { useState } from 'react';
import { calculateVAMortgage, type VALoanUse } from '@/lib/calculators/va-mortgage/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function VAMortgageCalculator() {
  const [homePrice, setHomePrice] = useState(400000);
  const [downPayment, setDownPayment] = useState(0);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [loanUse, setLoanUse] = useState<VALoanUse>('first');
  const [isFundingFeeExempt, setIsFundingFeeExempt] = useState(false);
  const [financeFundingFee, setFinanceFundingFee] = useState(true);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState(1200);
  const [hoaMonthly, setHoaMonthly] = useState(0);

  const result = calculateVAMortgage({
    homePrice, downPayment, interestRate, loanTermYears,
    loanUse, isFundingFeeExempt, financeFundingFee,
    propertyTaxRate, homeInsuranceAnnual, hoaMonthly,
  });

  const downPct = homePrice > 0 ? ((downPayment / homePrice) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* VA benefit notice */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
        🎖 VA loans require no minimum down payment and no PMI — exclusively for eligible veterans, active-duty service members, and surviving spouses.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Home Price ($)" htmlFor="va-price">
            <input id="va-price" type="number" value={homePrice} min={0} step={1000}
              onChange={e => setHomePrice(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label={`Down Payment ($) — ${downPct}% (0% allowed)`} htmlFor="va-down">
            <input id="va-down" type="number" value={downPayment} min={0} step={1000}
              onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="va-rate">
            <input id="va-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Term (years)" htmlFor="va-term">
            <input id="va-term" type="number" value={loanTermYears} min={1} max={30}
              onChange={e => setLoanTermYears(+e.target.value || 30)} className={inputClass} />
          </Field>
          <Field label="Loan Use" htmlFor="va-use">
            <select id="va-use" value={loanUse}
              onChange={e => setLoanUse(e.target.value as VALoanUse)} className={inputClass}>
              <option value="first">First Use</option>
              <option value="subsequent">Subsequent Use</option>
            </select>
          </Field>
          <Field label="Funding Fee Exempt?" htmlFor="va-exempt">
            <select id="va-exempt" value={isFundingFeeExempt ? 'yes' : 'no'}
              onChange={e => setIsFundingFeeExempt(e.target.value === 'yes')} className={inputClass}>
              <option value="no">No — standard fee applies</option>
              <option value="yes">Yes — disability / surviving spouse</option>
            </select>
          </Field>
          <Field label="Finance Funding Fee?" htmlFor="va-finance">
            <select id="va-finance" value={financeFundingFee ? 'yes' : 'no'}
              onChange={e => setFinanceFundingFee(e.target.value === 'yes')} className={inputClass}>
              <option value="yes">Yes — roll into loan</option>
              <option value="no">No — pay at closing</option>
            </select>
          </Field>
          <Field label="Property Tax Rate (%/yr)" htmlFor="va-tax">
            <input id="va-tax" type="number" value={propertyTaxRate} min={0} max={10} step={0.01}
              onChange={e => setPropertyTaxRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Home Insurance ($/yr)" htmlFor="va-ins">
            <input id="va-ins" type="number" value={homeInsuranceAnnual} min={0} step={100}
              onChange={e => setHomeInsuranceAnnual(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="HOA Fee ($/mo)" htmlFor="va-hoa">
            <input id="va-hoa" type="number" value={hoaMonthly} min={0} step={10}
              onChange={e => setHoaMonthly(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Total Monthly Payment" value={formatCurrency(result.totalMonthlyPayment)} />
          <ResultCard label="Principal & Interest" value={formatCurrency(result.monthlyPrincipalAndInterest)} />
          <ResultCard label="Property Tax" value={formatCurrency(result.monthlyPropertyTax)} />
          <ResultCard label="Insurance" value={formatCurrency(result.monthlyInsurance)} />
          {result.monthlyHoa > 0 && <ResultCard label="HOA" value={formatCurrency(result.monthlyHoa)} />}
          <ResultCard label={`VA Funding Fee (${result.fundingFeeRate}%)`} value={isFundingFeeExempt ? 'Exempt ($0)' : formatCurrency(result.fundingFeeAmount)} />
          <ResultCard label="Total Loan Amount" value={formatCurrency(result.totalLoanAmount)} />
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)} />
          <ResultCard label="Total Cost" value={formatCurrency(result.totalCost)} />
          {result.savingsVsConventionalPmi > 0 && (
            <ResultCard label="Est. PMI Savings vs Conventional"
              value={<span className="text-green-600 dark:text-green-400">{formatCurrency(result.savingsVsConventionalPmi)}</span>} />
          )}
        </ResultsPanel>
      </div>
    </div>
  );
}
