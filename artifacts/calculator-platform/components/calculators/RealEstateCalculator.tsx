'use client';

import { useState } from 'react';
import { calculateRealEstate } from '@/lib/calculators/real-estate/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function RealEstateCalculator() {
  const [purchasePrice, setPurchasePrice] = useState(400000);
  const [downPayment, setDownPayment] = useState(80000);
  const [closingCostsPct, setClosingCostsPct] = useState(3);
  const [interestRate, setInterestRate] = useState(6.85);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [appreciationRatePct, setAppreciationRatePct] = useState(3);
  const [yearsHeld, setYearsHeld] = useState(10);
  const [sellingCostsPct, setSellingCostsPct] = useState(6);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [annualOpEx, setAnnualOpEx] = useState(0);

  const result = calculateRealEstate({
    purchasePrice, downPayment, closingCostsPct, interestRate,
    loanTermYears, appreciationRatePct, yearsHeld, sellingCostsPct,
    monthlyRent: monthlyRent || undefined,
    annualOperatingExpenses: annualOpEx || undefined,
  });

  const profitColor = result.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const roiColor = result.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Purchase Price ($)" htmlFor="re-price">
            <input id="re-price" type="number" value={purchasePrice} min={0} step={1000}
              onChange={e => setPurchasePrice(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Down Payment ($)" htmlFor="re-down">
            <input id="re-down" type="number" value={downPayment} min={0} step={1000}
              onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="re-rate">
            <input id="re-rate" type="number" value={interestRate} min={0} max={30} step={0.01}
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Loan Term (years)" htmlFor="re-term">
            <input id="re-term" type="number" value={loanTermYears} min={1} max={30}
              onChange={e => setLoanTermYears(+e.target.value || 30)} className={inputClass} />
          </Field>
          <Field label="Closing Costs (%)" htmlFor="re-closing">
            <input id="re-closing" type="number" value={closingCostsPct} min={0} max={10} step={0.1}
              onChange={e => setClosingCostsPct(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Annual Appreciation (%)" htmlFor="re-appr">
            <input id="re-appr" type="number" value={appreciationRatePct} min={0} max={30} step={0.1}
              onChange={e => setAppreciationRatePct(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Years Held" htmlFor="re-years">
            <input id="re-years" type="number" value={yearsHeld} min={1} max={50}
              onChange={e => setYearsHeld(+e.target.value || 1)} className={inputClass} />
          </Field>
          <Field label="Selling Costs (%)" htmlFor="re-sell">
            <input id="re-sell" type="number" value={sellingCostsPct} min={0} max={15} step={0.1}
              onChange={e => setSellingCostsPct(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Monthly Rent ($ optional)" htmlFor="re-rent">
            <input id="re-rent" type="number" value={monthlyRent} min={0} step={50} placeholder="0"
              onChange={e => setMonthlyRent(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Annual Operating Expenses ($ optional)" htmlFor="re-opex">
            <input id="re-opex" type="number" value={annualOpEx} min={0} step={100} placeholder="0"
              onChange={e => setAnnualOpEx(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label={`Home Value in ${yearsHeld} Years`} value={formatCurrency(result.homeValueAtSale)} />
          <ResultCard label="Net Profit"
            value={<span className={profitColor}>{formatCurrency(result.netProfit)}</span>} />
          <ResultCard label="Total ROI"
            value={<span className={roiColor}>{result.roi.toFixed(1)}%</span>} />
          <ResultCard label="Annualized ROI (CAGR)"
            value={<span className={roiColor}>{result.annualizedRoi.toFixed(2)}%/yr</span>} />
          <ResultCard label="Net Sale Proceeds" value={formatCurrency(result.netSaleProceeds)} />
          <ResultCard label="Total Cash Invested" value={formatCurrency(result.totalCashInvested)} />
          <ResultCard label="Equity Built" value={formatCurrency(result.totalEquityBuilt)} />
          <ResultCard label="Gross Appreciation" value={formatCurrency(result.grossProfit)} />
          {result.totalRentalIncome !== undefined && (
            <ResultCard label={`Total Rental Income (${yearsHeld} yrs)`} value={formatCurrency(result.totalRentalIncome)} />
          )}
          {result.netRentalProfit !== undefined && (
            <ResultCard label="Net Rental Profit" value={formatCurrency(result.netRentalProfit)} />
          )}
        </ResultsPanel>
      </div>
    </div>
  );
}
