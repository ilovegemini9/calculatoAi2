'use client';

import { useState } from 'react';
import { calculateRentalProperty } from '@/lib/calculators/rental-property/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function RentalPropertyCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(350000);
  const [downPayment, setDownPayment] = useState(70000);
  const [interestRate, setInterestRate] = useState(7.0);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [monthlyRent, setMonthlyRent] = useState(2500);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [insuranceAnnual, setInsuranceAnnual] = useState(1400);
  const [maintenancePct, setMaintenancePct] = useState(1.0);
  const [vacancyRatePct, setVacancyRatePct] = useState(5);
  const [managementFeePct, setManagementFeePct] = useState(8);
  const [closingCostsPct, setClosingCostsPct] = useState(3);

  const result = calculateRentalProperty({
    purchasePrice, downPayment, interestRate, loanTermYears,
    monthlyRent, propertyTaxRate, insuranceAnnual,
    maintenancePct, vacancyRatePct, managementFeePct, closingCostsPct,
  });

  const cashFlowColor = result.monthlyCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const cocColor = result.cashOnCashReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Purchase Price ($)" htmlFor="rp-price">
            <input id="rp-price" type="number" value={purchasePrice} min={0} step={1000}
              onChange={e => setPurchasePrice(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Down Payment ($)" htmlFor="rp-down">
            <input id="rp-down" type="number" value={downPayment} min={0} step={1000}
              onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="rp-rate">
            <input id="rp-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Term (years)" htmlFor="rp-term">
            <input id="rp-term" type="number" value={loanTermYears} min={1} max={30}
              onChange={e => setLoanTermYears(+e.target.value || 30)} className={inputClass} />
          </Field>
          <Field label="Monthly Rent ($)" htmlFor="rp-rent">
            <input id="rp-rent" type="number" value={monthlyRent} min={0} step={50}
              onChange={e => setMonthlyRent(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Property Tax Rate (%/yr)" htmlFor="rp-tax">
            <input id="rp-tax" type="number" value={propertyTaxRate} min={0} max={10} step={0.01}
              onChange={e => setPropertyTaxRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Insurance ($/yr)" htmlFor="rp-ins">
            <input id="rp-ins" type="number" value={insuranceAnnual} min={0} step={100}
              onChange={e => setInsuranceAnnual(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Maintenance (% of value/yr)" htmlFor="rp-maint">
            <input id="rp-maint" type="number" value={maintenancePct} min={0} max={10} step={0.1}
              onChange={e => setMaintenancePct(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Vacancy Rate (%)" htmlFor="rp-vacancy">
            <input id="rp-vacancy" type="number" value={vacancyRatePct} min={0} max={100} step={1}
              onChange={e => setVacancyRatePct(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Property Management (%)" htmlFor="rp-mgmt">
            <input id="rp-mgmt" type="number" value={managementFeePct} min={0} max={30} step={1}
              onChange={e => setManagementFeePct(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Closing Costs (%)" htmlFor="rp-closing">
            <input id="rp-closing" type="number" value={closingCostsPct} min={0} max={10} step={0.1}
              onChange={e => setClosingCostsPct(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Monthly Cash Flow"
            value={<span className={cashFlowColor}>{formatCurrency(result.monthlyCashFlow)}</span>} />
          <ResultCard label="Cash-on-Cash Return"
            value={<span className={cocColor}>{result.cashOnCashReturn.toFixed(2)}%</span>} />
          <ResultCard label="Cap Rate" value={`${result.capRate.toFixed(2)}%`} />
          <ResultCard label="Gross Rent Multiplier" value={`${result.grossRentMultiplier.toFixed(1)}×`} />
          <ResultCard label="Net Operating Income" value={formatCurrency(result.netOperatingIncome) + '/yr'} />
          <ResultCard label="Monthly Mortgage (P&I)" value={formatCurrency(result.monthlyPayment)} />
          <ResultCard label="Total Cash Invested" value={formatCurrency(result.totalCashInvested)} />
          <ResultCard label="Total Annual Expenses" value={formatCurrency(result.totalAnnualExpenses)} />
        </ResultsPanel>
      </div>

      {/* Income & Expense Breakdown */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Annual Income & Expense Breakdown</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><span style={{ color: 'var(--text-muted)' }}>Gross Rent</span><br /><strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(result.grossAnnualRent)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Vacancy Loss</span><br /><strong className="text-red-500">−{formatCurrency(result.vacancyLoss)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Eff. Gross Income</span><br /><strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(result.effectiveGrossIncome)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Mortgage</span><br /><strong className="text-red-500">−{formatCurrency(result.annualMortgage)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Property Tax</span><br /><strong className="text-red-500">−{formatCurrency(result.annualPropertyTax)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Insurance</span><br /><strong className="text-red-500">−{formatCurrency(result.annualInsurance)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Maintenance</span><br /><strong className="text-red-500">−{formatCurrency(result.annualMaintenance)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Management</span><br /><strong className="text-red-500">−{formatCurrency(result.annualManagement)}</strong></div>
        </div>
      </div>
    </div>
  );
}
