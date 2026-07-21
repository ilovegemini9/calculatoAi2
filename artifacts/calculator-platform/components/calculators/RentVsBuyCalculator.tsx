'use client';

import { useState } from 'react';
import { calculateRentVsBuy } from '@/lib/calculators/rent-vs-buy/formula';
import { ResultCard, ResultsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function RentVsBuyCalculator() {
  // Buying
  const [homePrice, setHomePrice] = useState(400000);
  const [downPayment, setDownPayment] = useState(80000);
  const [mortgageRate, setMortgageRate] = useState(6.85);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [homeInsuranceRate, setHomeInsuranceRate] = useState(0.5);
  const [hoaMonthly, setHoaMonthly] = useState(0);
  const [maintenanceRate, setMaintenanceRate] = useState(1.0);
  const [closingCostRate, setClosingCostRate] = useState(2.5);
  const [sellingCostRate, setSellingCostRate] = useState(6.0);
  const [homeAppreciationRate, setHomeAppreciationRate] = useState(3.0);
  // Renting
  const [monthlyRent, setMonthlyRent] = useState(2200);
  const [annualRentIncrease, setAnnualRentIncrease] = useState(3.0);
  const [rentersInsuranceMonthly, setRentersInsuranceMonthly] = useState(15);
  // Common
  const [yearsToCompare, setYearsToCompare] = useState(10);
  const [investmentReturnRate, setInvestmentReturnRate] = useState(7.0);

  const result = calculateRentVsBuy({
    homePrice, downPayment, mortgageRate, loanTermYears,
    propertyTaxRate, homeInsuranceRate, hoaMonthly, maintenanceRate,
    closingCostRate, sellingCostRate, homeAppreciationRate,
    monthlyRent, annualRentIncrease, rentersInsuranceMonthly,
    yearsToCompare, investmentReturnRate,
  });

  const isBuyingBetter = result.buyingNetCost < result.rentingNetCost;
  const advantage = Math.abs(result.buyingNetCost - result.rentingNetCost);
  const downPct = homePrice > 0 ? ((downPayment / homePrice) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Verdict banner */}
      <div
        className={`rounded-2xl border p-5 ${
          isBuyingBetter
            ? 'bg-blue-600/10 border-blue-500/30'
            : 'bg-purple-600/10 border-purple-500/30'
        }`}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{isBuyingBetter ? '🏠' : '🏢'}</span>
          <div>
            <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              {isBuyingBetter ? 'Buying is financially better' : 'Renting is financially better'} over {yearsToCompare} years
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {isBuyingBetter ? 'Buying' : 'Renting'} saves you approximately{' '}
              <strong className={isBuyingBetter ? 'text-blue-500' : 'text-purple-500'}>
                {formatCurrency(advantage)}
              </strong>{' '}
              in net cost.{' '}
              {result.breakEvenYear
                ? `Break-even point: Year ${result.breakEvenYear}.`
                : 'Buying never reaches break-even in this scenario.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          {/* Buying section */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-blue-500">🏠 Buying</p>
            <div className="space-y-4">
              <Field label="Home Price ($)" htmlFor="rvb-price">
                <input id="rvb-price" type="number" value={homePrice} min={0} step={5000}
                  aria-label="Home purchase price in dollars"
                  onChange={e => setHomePrice(+e.target.value || 0)} className={inputClass} />
              </Field>
              <Field label={`Down Payment ($) — ${downPct}%`} htmlFor="rvb-down">
                <input id="rvb-down" type="number" value={downPayment} min={0} step={5000}
                  aria-label="Down payment amount in dollars"
                  onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rate (%)" htmlFor="rvb-rate">
                  <input id="rvb-rate" type="number" value={mortgageRate} min={0} max={30} step={0.01}
                    aria-label="Mortgage interest rate"
                    onChange={e => setMortgageRate(+e.target.value || 0)} className={inputClass} />
                </Field>
                <Field label="Term (yrs)" htmlFor="rvb-term">
                  <input id="rvb-term" type="number" value={loanTermYears} min={1} max={30}
                    aria-label="Loan term in years"
                    onChange={e => setLoanTermYears(+e.target.value || 30)} className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tax Rate (%/yr)" htmlFor="rvb-tax">
                  <input id="rvb-tax" type="number" value={propertyTaxRate} min={0} max={10} step={0.1}
                    aria-label="Property tax rate"
                    onChange={e => setPropertyTaxRate(+e.target.value || 0)} className={inputClass} />
                </Field>
                <Field label="Insurance (%/yr)" htmlFor="rvb-ins">
                  <input id="rvb-ins" type="number" value={homeInsuranceRate} min={0} max={5} step={0.05}
                    aria-label="Home insurance rate"
                    onChange={e => setHomeInsuranceRate(+e.target.value || 0)} className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Maintenance (%/yr)" htmlFor="rvb-maint">
                  <input id="rvb-maint" type="number" value={maintenanceRate} min={0} max={10} step={0.1}
                    aria-label="Annual maintenance rate as percentage of home value"
                    onChange={e => setMaintenanceRate(+e.target.value || 0)} className={inputClass} />
                </Field>
                <Field label="HOA ($/mo)" htmlFor="rvb-hoa">
                  <input id="rvb-hoa" type="number" value={hoaMonthly} min={0} step={25}
                    aria-label="Monthly HOA fee"
                    onChange={e => setHoaMonthly(+e.target.value || 0)} className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Closing Costs (%)" htmlFor="rvb-close">
                  <input id="rvb-close" type="number" value={closingCostRate} min={0} max={10} step={0.1}
                    aria-label="Closing costs as percentage of purchase price"
                    onChange={e => setClosingCostRate(+e.target.value || 0)} className={inputClass} />
                </Field>
                <Field label="Selling Costs (%)" htmlFor="rvb-sell">
                  <input id="rvb-sell" type="number" value={sellingCostRate} min={0} max={15} step={0.1}
                    aria-label="Selling costs as percentage of sale price"
                    onChange={e => setSellingCostRate(+e.target.value || 0)} className={inputClass} />
                </Field>
              </div>
              <Field label="Home Appreciation (%/yr)" htmlFor="rvb-appr">
                <input id="rvb-appr" type="number" value={homeAppreciationRate} min={0} max={20} step={0.1}
                  aria-label="Annual home appreciation rate"
                  onChange={e => setHomeAppreciationRate(+e.target.value || 0)} className={inputClass} />
              </Field>
            </div>
          </div>

          {/* Renting section */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-purple-500">🏢 Renting</p>
            <div className="space-y-4">
              <Field label="Monthly Rent ($)" htmlFor="rvb-rent">
                <input id="rvb-rent" type="number" value={monthlyRent} min={0} step={100}
                  aria-label="Monthly rent in dollars"
                  onChange={e => setMonthlyRent(+e.target.value || 0)} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Annual Increase (%)" htmlFor="rvb-rentinc">
                  <input id="rvb-rentinc" type="number" value={annualRentIncrease} min={0} max={20} step={0.5}
                    aria-label="Annual rent increase percentage"
                    onChange={e => setAnnualRentIncrease(+e.target.value || 0)} className={inputClass} />
                </Field>
                <Field label="Insurance ($/mo)" htmlFor="rvb-rins">
                  <input id="rvb-rins" type="number" value={rentersInsuranceMonthly} min={0} step={5}
                    aria-label="Monthly renters insurance"
                    onChange={e => setRentersInsuranceMonthly(+e.target.value || 0)} className={inputClass} />
                </Field>
              </div>
            </div>
          </div>

          {/* Scenario settings */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>⚙ Scenario</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Years to Compare" htmlFor="rvb-years">
                <input id="rvb-years" type="number" value={yearsToCompare} min={1} max={30}
                  aria-label="Number of years to compare"
                  onChange={e => setYearsToCompare(Math.min(30, Math.max(1, +e.target.value || 10)))} className={inputClass} />
              </Field>
              <Field label="Investment Return (%/yr)" htmlFor="rvb-invest"
                hint="Return if down payment were invested instead.">
                <input id="rvb-invest" type="number" value={investmentReturnRate} min={0} max={30} step={0.1}
                  aria-label="Annual investment return rate for down payment opportunity cost"
                  onChange={e => setInvestmentReturnRate(+e.target.value || 0)} className={inputClass} />
              </Field>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <ResultsPanel title="Financial Comparison">
            <ResultCard highlight={isBuyingBetter} label="Buying Net Cost" value={formatCurrency(result.buyingNetCost)}
              sub="Total paid − equity at sale" />
            <ResultCard highlight={!isBuyingBetter} label="Renting Net Cost" value={formatCurrency(result.rentingNetCost)}
              sub="Total rent − investment growth" />
            <ResultCard label="Break-Even Year"
              value={result.breakEvenYear ? `Year ${result.breakEvenYear}` : 'Never'}
              sub="When buying becomes cheaper" />
            <ResultCard label="Monthly Mortgage (P&I)" value={formatCurrency(result.monthlyMortgagePI)} />
            <ResultCard label="Monthly Buying (All-in)" value={formatCurrency(result.monthlyBuyingTotal)}
              sub="Yr 1: P&I + tax + ins + maint" />
            <ResultCard label="Total Interest Paid" value={formatCurrency(result.totalInterestPaid)} />
          </ResultsPanel>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              After {yearsToCompare} Years
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 border border-blue-500/20 bg-blue-500/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Home Value</p>
                <p className="text-lg font-black font-mono text-white">{formatCurrency(result.finalHomeValue)}</p>
              </div>
              <div className="rounded-xl p-3 border border-blue-500/20 bg-blue-500/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Home Equity</p>
                <p className="text-lg font-black font-mono text-white">{formatCurrency(result.finalHomeEquity)}</p>
              </div>
              <div className="rounded-xl p-3 border border-purple-500/20 bg-purple-500/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-1">Investment (if renting)</p>
                <p className="text-lg font-black font-mono text-white">{formatCurrency(result.finalInvestmentValue)}</p>
              </div>
              <div className="rounded-xl p-3 border border-purple-500/20 bg-purple-500/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-1">Net Advantage</p>
                <p className={`text-lg font-black font-mono ${isBuyingBetter ? 'text-blue-400' : 'text-purple-400'}`}>
                  {isBuyingBetter ? '🏠 ' : '🏢 '}{formatCurrency(advantage)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-year comparison table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Year-by-Year Net Cost Comparison
          </p>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-xs" role="table" aria-label="Year-by-year rent vs buy comparison">
            <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-input)' }}>
              <tr>
                {['Yr', 'Buy: Cumulative', 'Buy: Equity', 'Buy: Net Cost', 'Rent: Cumulative', 'Rent: Investment', 'Rent: Net Cost', 'Advantage'].map(h => (
                  <th key={h} scope="col"
                    className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-[9px] border-b whitespace-nowrap"
                    style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {result.yearlyComparison.map(row => (
                <tr key={row.year}
                  className={`transition-colors hover:bg-[var(--bg-card-hover)] ${row.year === result.breakEvenYear ? 'outline outline-1 outline-blue-500/40' : ''}`}>
                  <td className="px-3 py-2 font-bold" style={{ color: 'var(--text-muted)' }}>
                    {row.year}
                    {row.year === result.breakEvenYear && (
                      <span className="ml-1 text-[9px] font-black text-blue-500">★</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-blue-400">{formatCurrency(row.cumulativeBuyingCost)}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.homeEquity)}</td>
                  <td className={`px-3 py-2 font-semibold ${row.advantage === 'buy' ? 'text-blue-400' : ''}`}>
                    {formatCurrency(row.buyingNetCost)}
                  </td>
                  <td className="px-3 py-2 text-purple-400">{formatCurrency(row.cumulativeRentingCost)}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.investmentValue)}</td>
                  <td className={`px-3 py-2 font-semibold ${row.advantage === 'rent' ? 'text-purple-400' : ''}`}>
                    {formatCurrency(row.rentingNetCost)}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      row.advantage === 'buy'
                        ? 'bg-blue-500/15 text-blue-400'
                        : row.advantage === 'rent'
                          ? 'bg-purple-500/15 text-purple-400'
                          : 'text-slate-400'
                    }`}>
                      {row.advantage === 'buy' ? '🏠 Buy' : row.advantage === 'rent' ? '🏢 Rent' : '≈ Tie'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-2.5 text-[10px] border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          ★ = Break-even year. Net Cost = cumulative payments minus equity (buying) or investment growth (renting).
        </p>
      </div>
    </div>
  );
}
