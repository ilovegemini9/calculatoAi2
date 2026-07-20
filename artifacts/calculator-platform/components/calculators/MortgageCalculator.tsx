'use client';

import { useState } from 'react';
import { calculateMortgage } from '@/lib/calculators/mortgage/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState(400000);
  const [downPayment, setDownPayment] = useState(80000);
  const [interestRate, setInterestRate] = useState(6.85);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState(1200);
  const [hoaMonthly, setHoaMonthly] = useState(0);

  const result = calculateMortgage({ homePrice, downPayment, interestRate, loanTermYears, propertyTaxRate, homeInsuranceAnnual, hoaMonthly });
  const downPct = homePrice > 0 ? ((downPayment / homePrice) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Home Price ($)" htmlFor="mort-home-price">
            <input id="mort-home-price" type="number" value={homePrice} min={0} step={1000}
              aria-label="Home price in dollars"
              onChange={e => setHomePrice(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label={`Down Payment ($) — ${downPct}%`} htmlFor="mort-down-payment">
            <input id="mort-down-payment" type="number" value={downPayment} min={0} step={1000}
              aria-label={`Down payment in dollars, currently ${downPct}% of home price`}
              onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="mort-rate">
            <input id="mort-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              aria-label="Annual interest rate as a percentage"
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Term (years)" htmlFor="mort-term">
            <input id="mort-term" type="number" value={loanTermYears} min={1} max={30}
              aria-label="Loan term in years"
              onChange={e => setLoanTermYears(+e.target.value || 30)} className={inputClass} />
          </Field>
          <Field label="Property Tax Rate (% of home/yr)" htmlFor="mort-tax">
            <input id="mort-tax" type="number" value={propertyTaxRate} min={0} max={10} step={0.01}
              aria-label="Annual property tax rate as a percentage of home value"
              onChange={e => setPropertyTaxRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Home Insurance ($/yr)" htmlFor="mort-insurance">
            <input id="mort-insurance" type="number" value={homeInsuranceAnnual} min={0} step={100}
              aria-label="Annual home insurance cost in dollars"
              onChange={e => setHomeInsuranceAnnual(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="HOA Fee ($/mo)" htmlFor="mort-hoa">
            <input id="mort-hoa" type="number" value={hoaMonthly} min={0} step={10}
              aria-label="Monthly HOA fee in dollars"
              onChange={e => setHoaMonthly(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Total Monthly Payment" value={formatCurrency(result.totalMonthlyPayment)} />
          <ResultCard label="Principal & Interest" value={formatCurrency(result.monthlyPrincipalAndInterest)} />
          <ResultCard label="Property Tax" value={formatCurrency(result.monthlyPropertyTax)} />
          <ResultCard label="Insurance" value={formatCurrency(result.monthlyInsurance)} />
          {result.monthlyHoa > 0 && <ResultCard label="HOA" value={formatCurrency(result.monthlyHoa)} />}
          <ResultCard label="Total Interest Paid" value={formatCurrency(result.totalInterest)} />
          <ResultCard label="Total Cost" value={formatCurrency(result.totalCost)} />
        </ResultsPanel>
      </div>
    </div>
  );
}
