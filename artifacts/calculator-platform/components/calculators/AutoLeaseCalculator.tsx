'use client';

import { useState } from 'react';
import { calculateAutoLease } from '@/lib/calculators/auto-lease/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

const TERM_OPTIONS = [24, 36, 39, 48];
const MILEAGE_OPTIONS = [10000, 12000, 15000, 18000];

/** Convert APR% to money factor */
const aprToMf = (apr: number) => Math.round((apr / 2400) * 1e6) / 1e6;
/** Convert money factor to APR% */
const mfToApr = (mf: number) => Math.round(mf * 2400 * 100) / 100;

export function AutoLeaseCalculator() {
  const [msrp, setMsrp]                         = useState(45000);
  const [negotiatedPrice, setNegotiatedPrice]   = useState(43000);
  const [downPayment, setDownPayment]           = useState(3000);
  const [tradeInValue, setTradeInValue]         = useState(0);
  const [acquisitionFee, setAcquisitionFee]     = useState(895);
  const [residualPct, setResidualPct]           = useState(55);
  const [useApr, setUseApr]                     = useState(true);
  const [aprInput, setAprInput]                 = useState(3.0);
  const [mfInput, setMfInput]                   = useState(0.00125);
  const [leaseTermMonths, setLeaseTermMonths]   = useState(36);
  const [salesTaxRate, setSalesTaxRate]         = useState(8.0);
  const [annualMileage, setAnnualMileage]       = useState(12000);
  const [excessMileageRate, setExcessMileageRate] = useState(0.25);

  const moneyFactor = useApr ? aprToMf(aprInput) : mfInput;

  const result = calculateAutoLease({
    msrp, negotiatedPrice, downPayment, tradeInValue,
    acquisitionFee, residualPct, moneyFactor,
    leaseTermMonths, salesTaxRate, annualMileage, excessMileageRate,
  });

  const savingsVsMsrp = msrp - negotiatedPrice;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel title="Lease Inputs">
          <Field label="MSRP ($)" htmlFor="lease-msrp"
            hint="Manufacturer's Suggested Retail Price — used for residual calculation.">
            <input id="lease-msrp" type="number" value={msrp} min={0} step={500}
              aria-label="Vehicle MSRP in dollars"
              onChange={e => setMsrp(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Negotiated Cap Cost ($)" htmlFor="lease-cap"
            hint="The price you negotiate with the dealer (before fees/adjustments).">
            <input id="lease-cap" type="number" value={negotiatedPrice} min={0} step={500}
              aria-label="Negotiated vehicle price in dollars"
              onChange={e => setNegotiatedPrice(+e.target.value || 0)} className={inputClass} />
            {savingsVsMsrp > 0 && (
              <p className="text-[11px] mt-1 text-green-600 dark:text-green-400 font-semibold">
                {formatCurrency(savingsVsMsrp)} off MSRP ({((savingsVsMsrp / msrp) * 100).toFixed(1)}%)
              </p>
            )}
          </Field>

          <div className="flex gap-3">
            <Field label="Down / Cap Reduction ($)" htmlFor="lease-down">
              <input id="lease-down" type="number" value={downPayment} min={0} step={500}
                aria-label="Down payment / cap cost reduction"
                onChange={e => setDownPayment(+e.target.value || 0)} className={inputClass} />
            </Field>
            <Field label="Trade-In ($)" htmlFor="lease-tradein">
              <input id="lease-tradein" type="number" value={tradeInValue} min={0} step={500}
                aria-label="Trade-in value"
                onChange={e => setTradeInValue(+e.target.value || 0)} className={inputClass} />
            </Field>
          </div>

          <Field label="Acquisition Fee ($)" htmlFor="lease-acq"
            hint="Lender/dealer fee rolled into the cap cost.">
            <input id="lease-acq" type="number" value={acquisitionFee} min={0} step={50}
              aria-label="Acquisition fee in dollars"
              onChange={e => setAcquisitionFee(+e.target.value || 0)} className={inputClass} />
          </Field>

          <Field label="Residual Value (% of MSRP)" htmlFor="lease-residual"
            hint="Set by the lender; higher = lower payment.">
            <input id="lease-residual" type="number" value={residualPct} min={1} max={99} step={0.5}
              aria-label="Residual value as a percentage of MSRP"
              onChange={e => setResidualPct(+e.target.value || 50)} className={inputClass} />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              = {formatCurrency(result.residualValue)} at lease end
            </p>
          </Field>

          {/* Money factor / APR toggle */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Finance Rate
              </label>
              <button type="button"
                onClick={() => setUseApr(v => !v)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {useApr ? 'Switch to Money Factor' : 'Switch to APR'}
              </button>
            </div>
            {useApr ? (
              <input type="number" value={aprInput} min={0} max={30} step={0.01}
                aria-label="Annual percentage rate"
                onChange={e => setAprInput(+e.target.value || 0)} className={inputClass}
                placeholder="APR %" />
            ) : (
              <input type="number" value={mfInput} min={0} max={0.01} step={0.00001}
                aria-label="Money factor"
                onChange={e => setMfInput(+e.target.value || 0)} className={inputClass}
                placeholder="Money factor, e.g. 0.00125" />
            )}
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {useApr
                ? `Money factor: ${moneyFactor.toFixed(5)}`
                : `Effective APR: ${mfToApr(mfInput)}%`}
            </p>
          </div>

          <Field label="Lease Term" htmlFor="lease-term">
            <select id="lease-term" value={leaseTermMonths} aria-label="Lease term in months"
              onChange={e => setLeaseTermMonths(+e.target.value)} className={selectClass}>
              {TERM_OPTIONS.map(m => (
                <option key={m} value={m}>{m} months</option>
              ))}
            </select>
          </Field>

          <div className="flex gap-3">
            <Field label="Sales Tax (%)" htmlFor="lease-tax">
              <input id="lease-tax" type="number" value={salesTaxRate} min={0} max={20} step={0.1}
                aria-label="Sales tax rate"
                onChange={e => setSalesTaxRate(+e.target.value || 0)} className={inputClass} />
            </Field>
            <Field label="Annual Miles" htmlFor="lease-miles">
              <select id="lease-miles" value={annualMileage} aria-label="Annual mileage allowance"
                onChange={e => setAnnualMileage(+e.target.value)} className={selectClass}>
                {MILEAGE_OPTIONS.map(m => (
                  <option key={m} value={m}>{m.toLocaleString()}/yr</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Excess Mileage Rate ($/mile)" htmlFor="lease-emr">
            <input id="lease-emr" type="number" value={excessMileageRate} min={0} max={1} step={0.01}
              aria-label="Charge per mile over the allowance"
              onChange={e => setExcessMileageRate(+e.target.value || 0)} className={inputClass} />
          </Field>
        </InputsPanel>

        <ResultsPanel title="Lease Summary">
          <ResultCard highlight label="Monthly Payment" value={formatCurrency(result.monthlyPayment)}
            sub={`Incl. ${salesTaxRate}% tax`} />
          <ResultCard label="Monthly (Pre-Tax)" value={formatCurrency(result.monthlyPaymentPreTax)}
            sub={`Depreciation ${formatCurrency(result.monthlyDepreciation)} + Finance ${formatCurrency(result.monthlyFinanceCharge)}`} />
          <ResultCard label="Adj. Cap Cost" value={formatCurrency(result.adjustedCapCost)}
            sub="Net cap cost after down & trade-in" />
          <ResultCard label="Residual Value" value={formatCurrency(result.residualValue)}
            sub={`${residualPct}% of MSRP — buyout price at end`} />
          <ResultCard label="Effective APR" value={`${result.effectiveApr.toFixed(2)}%`}
            sub="Money factor × 2400" />
          <ResultCard label="Total Lease Cost" value={formatCurrency(result.totalCostToLease)}
            sub={`Down + ${leaseTermMonths} payments`} />
          <ResultCard label="Mileage Allowance" value={`${result.totalMileageAllowance.toLocaleString()} mi`}
            sub={`${annualMileage.toLocaleString()} mi/yr — $${excessMileageRate}/mi over`} />
        </ResultsPanel>
      </div>

      {/* Due at signing */}
      <div className="rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 border-slate-200 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Due at Signing (est.)</p>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1">
            First Payment {formatCurrency(result.monthlyPayment)}
          </span>
          <span className="text-slate-400">+</span>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1">
            Down {formatCurrency(downPayment)}
          </span>
          <span className="text-slate-400">≈</span>
          <span className="rounded-full bg-blue-600 text-white px-3 py-1">
            {formatCurrency(result.totalDueAtSigning)}
          </span>
          <span className="text-[10px] text-slate-400 ml-1">(excl. DMV/registration)</span>
        </div>
      </div>

      {/* Lease info note */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
        <strong>How lease payments work:</strong> Your payment covers the vehicle's
        depreciation ({formatCurrency(result.monthlyDepreciation)}/mo) plus the finance charge
        ({formatCurrency(result.monthlyFinanceCharge)}/mo). The residual value (
        {formatCurrency(result.residualValue)}) is what you'd pay to buy the vehicle at lease end.
        Negotiating a lower cap cost and a higher residual both lower your monthly payment.
      </div>
    </div>
  );
}
