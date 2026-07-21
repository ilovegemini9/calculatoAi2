'use client';

import { useState } from 'react';
import { calculateHouseAffordability } from '@/lib/calculators/house-affordability/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency, formatPercent } from '@/lib/utils';

export function HouseAffordabilityCalculator() {
  const [annualIncome, setAnnualIncome] = useState(120000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [downPayment, setDownPayment] = useState(60000);
  const [interestRate, setInterestRate] = useState(6.85);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [homeInsuranceRate, setHomeInsuranceRate] = useState(0.5);
  const [hoaMonthly, setHoaMonthly] = useState(0);
  const [frontEndDtiLimit, setFrontEndDtiLimit] = useState(28);
  const [backEndDtiLimit, setBackEndDtiLimit] = useState(36);

  const result = calculateHouseAffordability({
    annualIncome,
    monthlyDebts,
    downPayment,
    interestRate,
    loanTermYears,
    propertyTaxRate,
    homeInsuranceRate,
    hoaMonthly,
    frontEndDtiLimit,
    backEndDtiLimit,
  });

  const bindingLabel = result.bindingConstraint === 'front-end'
    ? `Front-end DTI (${frontEndDtiLimit}% limit)`
    : `Back-end DTI (${backEndDtiLimit}% limit)`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Annual Gross Income ($)" htmlFor="aff-income">
            <input id="aff-income" type="number" value={annualIncome} min={0} step={5000}
              aria-label="Annual gross income in dollars"
              onChange={e => setAnnualIncome(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Monthly Debt Payments ($)" htmlFor="aff-debts"
            hint="Car loans, student loans, credit card minimums, etc.">
            <input id="aff-debts" type="number" value={monthlyDebts} min={0} step={50}
              aria-label="Total monthly debt payments in dollars"
              onChange={e => setMonthlyDebts(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Down Payment ($)" htmlFor="aff-down">
            <input id="aff-down" type="number" value={downPayment} min={0} step={5000}
              aria-label="Down payment in dollars"
              onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="aff-rate">
            <input id="aff-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              aria-label="Annual mortgage interest rate as a percentage"
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Term (years)" htmlFor="aff-term">
            <input id="aff-term" type="number" value={loanTermYears} min={1} max={30}
              aria-label="Loan term in years"
              onChange={e => setLoanTermYears(+e.target.value || 30)} className={inputClass} />
          </Field>
          <Field label="Property Tax Rate (% /yr)" htmlFor="aff-tax">
            <input id="aff-tax" type="number" value={propertyTaxRate} min={0} max={10} step={0.01}
              aria-label="Annual property tax rate as a percentage of home value"
              onChange={e => setPropertyTaxRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Home Insurance (% /yr)" htmlFor="aff-ins"
            hint="Typically 0.25–1% of home value annually.">
            <input id="aff-ins" type="number" value={homeInsuranceRate} min={0} max={5} step={0.05}
              aria-label="Annual home insurance rate as a percentage of home value"
              onChange={e => setHomeInsuranceRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="HOA Fee ($/mo)" htmlFor="aff-hoa">
            <input id="aff-hoa" type="number" value={hoaMonthly} min={0} step={25}
              aria-label="Monthly HOA fee in dollars"
              onChange={e => setHoaMonthly(+e.target.value || 0)} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Front-End DTI Limit (%)" htmlFor="aff-fe">
              <input id="aff-fe" type="number" value={frontEndDtiLimit} min={1} max={50} step={1}
                aria-label="Front-end debt-to-income ratio limit as a percentage"
                onChange={e => setFrontEndDtiLimit(+e.target.value || 28)} className={inputClass} />
            </Field>
            <Field label="Back-End DTI Limit (%)" htmlFor="aff-be">
              <input id="aff-be" type="number" value={backEndDtiLimit} min={1} max={60} step={1}
                aria-label="Back-end debt-to-income ratio limit as a percentage"
                onChange={e => setBackEndDtiLimit(+e.target.value || 36)} className={inputClass} />
            </Field>
          </div>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Max Home Price" value={formatCurrency(result.maxHomePrice)} />
          <ResultCard label="Max Loan Amount" value={formatCurrency(result.maxLoanAmount)} />
          <ResultCard label="Max Monthly PITI" value={formatCurrency(result.maxMonthlyPITI)} />
          <ResultCard label="Monthly Income" value={formatCurrency(result.monthlyIncome)} />
          <ResultCard label="Front-End DTI" value={formatPercent(result.frontEndDti)}
            sub={`Limit: ${frontEndDtiLimit}%`} />
          <ResultCard label="Back-End DTI" value={formatPercent(result.backEndDti)}
            sub={`Limit: ${backEndDtiLimit}%`} />
          <ResultCard label="Down Payment %" value={formatPercent(result.downPaymentPercent)} />
          <ResultCard label="Binding Constraint" value={bindingLabel} />
        </ResultsPanel>
      </div>

      {/* Payment breakdown */}
      <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          Monthly Payment Breakdown
        </p>
        <div className="space-y-2" role="list" aria-label="Monthly payment components">
          {[
            { label: 'Principal & Interest', value: result.monthlyPI, color: 'bg-blue-500' },
            { label: 'Property Tax', value: result.monthlyTax, color: 'bg-indigo-500' },
            { label: 'Home Insurance', value: result.monthlyInsurance, color: 'bg-violet-500' },
            { label: 'HOA Fee', value: result.monthlyHoa, color: 'bg-purple-500' },
          ].filter(item => item.value > 0).map(item => {
            const pct = result.maxMonthlyPITI > 0
              ? Math.round((item.value / result.maxMonthlyPITI) * 100)
              : 0;
            return (
              <div key={item.label} role="listitem">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(item.value)} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.label} is ${pct}% of total payment`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
          ⚠ PMI (Private Mortgage Insurance) may apply if down payment is under 20% — typically 0.5–1.5% of the loan per year.
          Down payment is currently {formatPercent(result.downPaymentPercent)}.
        </p>
      </div>
    </div>
  );
}
