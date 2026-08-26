'use client';

import { useMemo, useState } from 'react';
import { calculateBondYield, calculateBusinessValuation, calculateCarAffordability, calculateDscr } from '@/lib/calculators/businessGaps';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

type Mode = 'business-valuation' | 'dscr' | 'car-affordability' | 'bond-yield';

function money(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function NumericField({ id, label, value, setValue, step = 1, min = 0, hint }: { id: string; label: string; value: number; setValue: (value: number) => void; step?: number; min?: number; hint?: string }) {
  return <Field label={label} htmlFor={id} hint={hint}><input id={id} type="number" min={min} step={step} value={value} onChange={(event) => setValue(Number(event.target.value))} className={inputClass} /></Field>;
}

export function BusinessGapCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(mode === 'business-valuation' ? 1_000_000 : mode === 'dscr' ? 120_000 : mode === 'car-affordability' ? 7_000 : 1_000);
  const [b, setB] = useState(mode === 'business-valuation' ? 20 : mode === 'dscr' ? 80_000 : mode === 'car-affordability' ? 500 : 5);
  const [c, setC] = useState(mode === 'business-valuation' ? 6 : mode === 'car-affordability' ? 10 : mode === 'bond-yield' ? 4 : 36);
  const [d, setD] = useState(mode === 'business-valuation' ? 100_000 : mode === 'car-affordability' ? 20 : mode === 'bond-yield' ? 980 : 0);
  const [e, setE] = useState(mode === 'car-affordability' ? 7 : 0);
  const result = useMemo(() => {
    if (mode === 'business-valuation') return calculateBusinessValuation(a, b, c, d);
    if (mode === 'dscr') return calculateDscr(a, b);
    if (mode === 'car-affordability') return calculateCarAffordability(a, b, c, d, e, 60);
    return calculateBondYield(a, b, d, c);
  }, [mode, a, b, c, d, e]);

  if (mode === 'business-valuation') {
    const r = result as ReturnType<typeof calculateBusinessValuation>;
    return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><InputsPanel title="Business Valuation Inputs">
      <NumericField id="business-valuation-revenue" label="Annual revenue" value={a} setValue={setA} step={10_000} />
      <NumericField id="business-valuation-margin" label="EBITDA margin (%)" value={b} setValue={setB} step={0.1} />
      <NumericField id="business-valuation-multiple" label="EBITDA valuation multiple" value={c} setValue={setC} step={0.1} />
      <NumericField id="business-valuation-debt" label="Net debt" value={d} setValue={setD} step={10_000} />
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>This scenario uses an EBITDA multiple. Actual value depends on growth, risk, cash flow, industry, and transaction terms.</p>
    </InputsPanel><ResultsPanel title="Business Valuation Results">
      <ResultCard highlight label="Estimated enterprise value" value={money(r.enterpriseValue)} />
      <ResultCard label="Estimated EBITDA" value={money(r.ebitda)} />
      <ResultCard label="Estimated equity value" value={money(r.equityValue)} />
      <ResultCard label="Implied revenue multiple" value={`${r.revenueMultiple.toFixed(2)}×`} sub="An illustrative market-multiple scenario, not a formal appraisal." />
    </ResultsPanel></div>;
  }

  if (mode === 'dscr') {
    const r = result as ReturnType<typeof calculateDscr>;
    return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><InputsPanel title="DSCR Inputs">
      <NumericField id="dscr-noi" label="Annual net operating income" value={a} setValue={setA} step={5_000} />
      <NumericField id="dscr-debt-service" label="Annual debt service" value={b} setValue={setB} step={5_000} />
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>Use operating income after normal property operating expenses, before debt service and income taxes. Lender definitions vary.</p>
    </InputsPanel><ResultsPanel title="DSCR Results">
      <ResultCard highlight label="Debt service coverage ratio" value={r.error ?? `${r.dscr.toFixed(2)}×`} />
      <ResultCard label="Annual surplus / shortfall" value={money(r.annualSurplus)} />
      <ResultCard label="NOI-based debt-service ceiling" value={money(r.maximumAnnualDebtService)} sub="A ratio of 1.00× means NOI equals annual debt service." />
    </ResultsPanel></div>;
  }

  if (mode === 'car-affordability') {
    const r = result as ReturnType<typeof calculateCarAffordability>;
    return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><InputsPanel title="Car Affordability Inputs">
      <NumericField id="car-affordability-income" label="Monthly gross income" value={a} setValue={setA} step={100} />
      <NumericField id="car-affordability-debts" label="Other monthly debt payments" value={b} setValue={setB} step={50} />
      <NumericField id="car-affordability-down" label="Down payment" value={c} setValue={setC} step={500} />
      <NumericField id="car-affordability-budget" label="Total debt budget (%)" value={d} setValue={setD} step={0.5} hint="The model reserves this share of income for total monthly debt." />
      <NumericField id="car-affordability-rate" label="Annual loan rate (%)" value={e} setValue={setE} step={0.1} />
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>The projection uses a 60-month term and treats the result as a budgeting estimate, excluding taxes, insurance, fuel, maintenance, and fees.</p>
    </InputsPanel><ResultsPanel title="Car Affordability Results">
      <ResultCard highlight label="Maximum modeled vehicle price" value={r.error ?? money(r.estimatedVehiclePrice)} />
      <ResultCard label="Maximum monthly payment" value={money(r.maximumMonthlyPayment)} />
      <ResultCard label="Supported loan amount" value={money(r.supportedLoanAmount)} />
      <ResultCard label="Estimated loan interest" value={money(r.totalInterest)} sub="Actual offers depend on credit, vehicle, lender, taxes, and term." />
    </ResultsPanel></div>;
  }

  const r = result as ReturnType<typeof calculateBondYield>;
  return <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><InputsPanel title="Bond Yield Inputs">
    <NumericField id="bond-yield-face" label="Face value" value={a} setValue={setA} step={100} />
    <NumericField id="bond-yield-coupon" label="Annual coupon rate (%)" value={b} setValue={setB} step={0.1} />
    <NumericField id="bond-yield-years" label="Years to maturity" value={c} setValue={setC} step={1} min={1} />
    <NumericField id="bond-yield-price" label="Market price" value={d} setValue={setD} step={10} />
    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>The approximate yield-to-maturity measure ignores reinvestment timing, taxes, call features, and compounding conventions.</p>
  </InputsPanel><ResultsPanel title="Bond Yield Results">
    <ResultCard highlight label="Approximate yield to maturity" value={r.error ?? `${r.approximateYtmPercent.toFixed(2)}%`} />
    <ResultCard label="Current yield" value={r.error ? '—' : `${r.currentYieldPercent.toFixed(2)}%`} />
    <ResultCard label="Annual coupon" value={money(r.annualCoupon)} />
    <ResultCard label="Premium / discount" value={money(r.premiumOrDiscount)} sub={r.premiumOrDiscount >= 0 ? 'The entered price is at or above face value.' : 'The entered price is below face value.'} />
  </ResultsPanel></div>;
}

export const BusinessValuationCalculator = () => <BusinessGapCalculator mode="business-valuation" />;
export const DscrCalculator = () => <BusinessGapCalculator mode="dscr" />;
export const CarAffordabilityCalculator = () => <BusinessGapCalculator mode="car-affordability" />;
export const BondYieldCalculator = () => <BusinessGapCalculator mode="bond-yield" />;
