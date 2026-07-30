'use client';

import { useState } from 'react';
import { calculateFHALoan } from '@/lib/calculators/fha-loan/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function FHALoanCalculator() {
  const [homePrice, setHomePrice] = useState(350000);
  const [downPayment, setDownPayment] = useState(12250); // 3.5%
  const [interestRate, setInterestRate] = useState(6.75);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [financeUpfrontMip, setFinanceUpfrontMip] = useState(true);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState(1200);
  const [hoaMonthly, setHoaMonthly] = useState(0);

  const result = calculateFHALoan({
    homePrice, downPayment, interestRate, loanTermYears,
    financeUpfrontMip, propertyTaxRate, homeInsuranceAnnual, hoaMonthly,
  });

  const minDown = Math.ceil(homePrice * 0.035);
  const downPct = homePrice > 0 ? ((downPayment / homePrice) * 100).toFixed(1) : '0';
  const mipYears = result.mipDurationMonths === result.mipDurationMonths
    ? Math.round(result.mipDurationMonths / 12)
    : '—';

  return (
    <div className="space-y-6">
      {downPayment < minDown && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          ⚠ FHA requires a minimum 3.5% down payment ({formatCurrency(minDown)} for this home price).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Home Price ($)" htmlFor="fha-price">
            <input id="fha-price" type="number" value={homePrice} min={0} step={1000}
              onChange={e => {
                const p = +e.target.value || 0;
                setHomePrice(p);
                setDownPayment(Math.ceil(p * 0.035));
              }} className={inputClass} />
          </Field>
          <Field label={`Down Payment ($) — ${downPct}% (min 3.5%)`} htmlFor="fha-down">
            <input id="fha-down" type="number" value={downPayment} min={0} step={500}
              onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="fha-rate">
            <input id="fha-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Term (years)" htmlFor="fha-term">
            <select id="fha-term" value={loanTermYears}
              onChange={e => setLoanTermYears(+e.target.value)} className={inputClass}>
              <option value={30}>30 years</option>
              <option value={15}>15 years</option>
            </select>
          </Field>
          <Field label="Finance Upfront MIP into Loan?" htmlFor="fha-finance-mip">
            <select id="fha-finance-mip" value={financeUpfrontMip ? 'yes' : 'no'}
              onChange={e => setFinanceUpfrontMip(e.target.value === 'yes')} className={inputClass}>
              <option value="yes">Yes — roll into loan</option>
              <option value="no">No — pay at closing</option>
            </select>
          </Field>
          <Field label="Property Tax Rate (%/yr)" htmlFor="fha-tax">
            <input id="fha-tax" type="number" value={propertyTaxRate} min={0} max={10} step={0.01}
              onChange={e => setPropertyTaxRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Home Insurance ($/yr)" htmlFor="fha-ins">
            <input id="fha-ins" type="number" value={homeInsuranceAnnual} min={0} step={100}
              onChange={e => setHomeInsuranceAnnual(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="HOA Fee ($/mo)" htmlFor="fha-hoa">
            <input id="fha-hoa" type="number" value={hoaMonthly} min={0} step={10}
              onChange={e => setHoaMonthly(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Total Monthly Payment" value={formatCurrency(result.totalMonthlyPayment)} />
          <ResultCard label="Principal & Interest" value={formatCurrency(result.monthlyPrincipalAndInterest)} />
          <ResultCard label={`Monthly MIP (${result.annualMipRate}%/yr)`} value={formatCurrency(result.monthlyMip)} />
          <ResultCard label="Property Tax" value={formatCurrency(result.monthlyPropertyTax)} />
          <ResultCard label="Insurance" value={formatCurrency(result.monthlyInsurance)} />
          {result.monthlyHoa > 0 && <ResultCard label="HOA" value={formatCurrency(result.monthlyHoa)} />}
          <ResultCard label="Upfront MIP (1.75%)" value={formatCurrency(result.upfrontMipAmount)} />
          <ResultCard label="Total Loan Amount" value={formatCurrency(result.totalLoanAmount)} />
          <ResultCard label="MIP Duration" value={`${mipYears} years`} />
          <ResultCard label="Total MIP Cost" value={formatCurrency(result.totalMipPaid)} />
          <ResultCard label="Total Interest" value={formatCurrency(result.totalInterest)} />
        </ResultsPanel>
      </div>
    </div>
  );
}
