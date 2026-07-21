'use client';

import { useState } from 'react';
import { calculateRent } from '@/lib/calculators/rent/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

export function RentCalculator() {
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [utilities, setUtilities] = useState(150);
  const [rentersInsurance, setRentersInsurance] = useState(15);
  const [parking, setParking] = useState(0);
  const [petFee, setPetFee] = useState(0);
  const [otherMonthly, setOtherMonthly] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(2000);
  const [brokerFee, setBrokerFee] = useState(0);
  const [annualRentIncrease, setAnnualRentIncrease] = useState(3);
  const [leaseTermMonths, setLeaseTermMonths] = useState(12);

  const result = calculateRent({
    monthlyRent,
    utilities,
    rentersInsurance,
    parking,
    petFee,
    otherMonthly,
    securityDeposit,
    brokerFee,
    annualRentIncrease,
    leaseTermMonths,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Monthly Rent ($)" htmlFor="rent-base">
            <input id="rent-base" type="number" value={monthlyRent} min={0} step={50}
              aria-label="Monthly base rent in dollars"
              onChange={e => setMonthlyRent(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Utilities ($/mo)" htmlFor="rent-util"
            hint="Average monthly electricity, gas, water, internet combined.">
            <input id="rent-util" type="number" value={utilities} min={0} step={10}
              aria-label="Monthly utilities cost in dollars"
              onChange={e => setUtilities(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Renter's Insurance ($/mo)" htmlFor="rent-ins">
            <input id="rent-ins" type="number" value={rentersInsurance} min={0} step={1}
              aria-label="Monthly renters insurance cost in dollars"
              onChange={e => setRentersInsurance(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Parking ($/mo)" htmlFor="rent-park">
            <input id="rent-park" type="number" value={parking} min={0} step={10}
              aria-label="Monthly parking cost in dollars"
              onChange={e => setParking(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Pet Fee ($/mo)" htmlFor="rent-pet">
            <input id="rent-pet" type="number" value={petFee} min={0} step={10}
              aria-label="Monthly pet fee in dollars"
              onChange={e => setPetFee(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Other Monthly Costs ($)" htmlFor="rent-other">
            <input id="rent-other" type="number" value={otherMonthly} min={0} step={10}
              aria-label="Other monthly costs in dollars"
              onChange={e => setOtherMonthly(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Security Deposit ($)" htmlFor="rent-deposit">
            <input id="rent-deposit" type="number" value={securityDeposit} min={0} step={100}
              aria-label="Security deposit in dollars"
              onChange={e => setSecurityDeposit(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Broker / Move-In Fee ($)" htmlFor="rent-broker"
            hint="One-time fee, e.g. one month's rent in some markets.">
            <input id="rent-broker" type="number" value={brokerFee} min={0} step={100}
              aria-label="One-time broker or move-in fee in dollars"
              onChange={e => setBrokerFee(+e.target.value || 0)} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Annual Rent Increase (%)" htmlFor="rent-increase">
              <input id="rent-increase" type="number" value={annualRentIncrease} min={0} max={30} step={0.5}
                aria-label="Annual rent increase percentage"
                onChange={e => setAnnualRentIncrease(+e.target.value || 0)} className={inputClass} />
            </Field>
            <Field label="Lease Term (months)" htmlFor="rent-term">
              <input id="rent-term" type="number" value={leaseTermMonths} min={1} max={60} step={1}
                aria-label="Lease term in months"
                onChange={e => setLeaseTermMonths(+e.target.value || 12)} className={inputClass} />
            </Field>
          </div>
        </InputsPanel>

        <ResultsPanel>
          <ResultCard highlight label="Total Monthly Cost" value={formatCurrency(result.monthlyTotal)} />
          <ResultCard label="Annual Cost" value={formatCurrency(result.annualTotal)} />
          <ResultCard label="Total Lease Cost" value={formatCurrency(result.totalLeaseCost)}
            sub={`Over ${leaseTermMonths} months`} />
          <ResultCard label="Upfront Costs" value={formatCurrency(result.totalUpfront)}
            sub="Deposit + broker fee" />
          <ResultCard label="True First-Year Cost" value={formatCurrency(result.totalTrueFirstYear)}
            sub="Annual + upfront" />
          <ResultCard label="Cost Per Day" value={formatCurrency(result.costPerDay)} />
        </ResultsPanel>
      </div>

      {/* Cost breakdown bar chart */}
      {result.rentBreakdown.length > 0 && (
        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Monthly Cost Breakdown
          </p>
          <div className="space-y-2.5" role="list" aria-label="Monthly cost breakdown by category">
            {result.rentBreakdown.map((item, i) => {
              const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500'];
              return (
                <div key={item.label} role="listitem">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(item.monthly)}&nbsp;
                      <span style={{ color: 'var(--text-muted)' }}>({item.percent}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-input)' }}>
                    <div
                      className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                      role="progressbar"
                      aria-valuenow={item.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${item.label} is ${item.percent}% of total monthly cost`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 10-year projection table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            10-Year Cost Projection (with {annualRentIncrease}% annual increase)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="table" aria-label="10-year rent cost projection">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                {['Year', 'Monthly Rent', 'Annual Total', 'Cumulative Total'].map(h => (
                  <th key={h} scope="col"
                    className="px-4 py-2.5 text-left font-black uppercase tracking-wider text-[10px]"
                    style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {result.yearlyProjection.map(row => (
                <tr key={row.year} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="px-4 py-2.5 font-bold text-blue-500">{row.year}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.monthlyRent)}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.annualTotal)}</td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.cumulativeTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
