'use client';

import { useState } from 'react';
import { calculateMortgageUk, type RepaymentType, type BuyerType } from '@/lib/calculators/mortgage-uk/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass, selectClass } from './ResultCard';

function formatGbp(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function MortgageUkCalculator() {
  const [propertyValue, setPropertyValue] = useState(350000);
  const [deposit, setDeposit] = useState(70000);
  const [interestRate, setInterestRate] = useState(4.5);
  const [termYears, setTermYears] = useState(25);
  const [repaymentType, setRepaymentType] = useState<RepaymentType>('repayment');
  const [buyerType, setBuyerType] = useState<BuyerType>('first-time');
  const [arrangementFee, setArrangementFee] = useState(999);
  const [rollArrangementFee, setRollArrangementFee] = useState(false);

  const result = calculateMortgageUk({
    propertyValue, deposit, interestRate,
    mortgageTermYears: termYears,
    repaymentType, buyerType,
    arrangementFee, rollArrangementFee,
  });

  const depositPct = propertyValue > 0 ? ((deposit / propertyValue) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InputsPanel>
          <Field label="Property Value (£)" htmlFor="uk-prop-value">
            <input id="uk-prop-value" type="number" value={propertyValue} min={0} step={5000}
              onChange={e => setPropertyValue(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label={`Deposit (£) — ${depositPct}%`} htmlFor="uk-deposit">
            <input id="uk-deposit" type="number" value={deposit} min={0} step={1000}
              onChange={e => setDeposit(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Interest Rate (%)" htmlFor="uk-rate"
            hint="Use your initial fixed-rate period rate (e.g. 2 or 5-year fix).">
            <input id="uk-rate" type="number" value={interestRate} min={0} max={20} step={0.01}
              onChange={e => setInterestRate(+e.target.value || 0)} className={inputClass} />
          </Field>
          <Field label="Mortgage Term (years)" htmlFor="uk-term">
            <select id="uk-term" value={termYears}
              onChange={e => setTermYears(+e.target.value)} className={selectClass}>
              {[10, 15, 20, 25, 30, 35].map(y => <option key={y} value={y}>{y} years</option>)}
            </select>
          </Field>
          <Field label="Repayment Type" htmlFor="uk-repay-type">
            <select id="uk-repay-type" value={repaymentType}
              onChange={e => setRepaymentType(e.target.value as RepaymentType)} className={selectClass}>
              <option value="repayment">Repayment (capital + interest)</option>
              <option value="interest-only">Interest-Only</option>
            </select>
          </Field>
          <Field label="Buyer Type" htmlFor="uk-buyer-type"
            hint="Affects Stamp Duty Land Tax (SDLT) rates — England & N. Ireland.">
            <select id="uk-buyer-type" value={buyerType}
              onChange={e => setBuyerType(e.target.value as BuyerType)} className={selectClass}>
              <option value="first-time">First-Time Buyer</option>
              <option value="home-mover">Home Mover</option>
              <option value="additional-property">Additional Property / Buy-to-Let (+3%)</option>
            </select>
          </Field>
          <Field label="Arrangement Fee (£)" htmlFor="uk-arr-fee"
            hint="Lender product fee. Typically £0–£2,000.">
            <input id="uk-arr-fee" type="number" value={arrangementFee} min={0} step={100}
              onChange={e => setArrangementFee(+e.target.value || 0)} className={inputClass} />
          </Field>
          {arrangementFee > 0 && (
            <Field label="Add Fee to Loan?" htmlFor="uk-roll-fee">
              <select id="uk-roll-fee" value={rollArrangementFee ? 'yes' : 'no'}
                onChange={e => setRollArrangementFee(e.target.value === 'yes')} className={selectClass}>
                <option value="no">No — pay upfront</option>
                <option value="yes">Yes — add to mortgage</option>
              </select>
            </Field>
          )}
        </InputsPanel>

        <ResultsPanel title="Live Results (GBP)">
          <ResultCard highlight label="Monthly Payment" value={formatGbp(result.monthlyPayment)}
            sub={repaymentType === 'interest-only' ? 'Interest-only · capital due at end' : 'Capital repayment'} />
          <ResultCard label="Loan Amount" value={formatGbp(result.loanAmount)}
            sub={`${formatPct(result.ltv)} LTV`} />
          <ResultCard label="Stamp Duty (SDLT)" value={formatGbp(result.totalStampDuty)} />
          <ResultCard label="Total Interest Paid" value={formatGbp(result.totalInterestPaid)} />
          <ResultCard label="Total Cost of Mortgage" value={formatGbp(result.totalCostOfMortgage)} />
          <ResultCard label="Total Purchase Cost" value={formatGbp(result.totalPurchaseCost)}
            sub="Property + SDLT + upfront fees" />
        </ResultsPanel>
      </div>

      {result.isHighLtv && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          ⚠ LTV is above 90%. High-LTV mortgages typically attract higher interest rates and fewer product options. A larger deposit will significantly improve your deal.
        </div>
      )}

      {repaymentType === 'interest-only' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          ℹ Interest-only mortgage: you repay <strong>{formatGbp(result.loanAmount)}</strong> capital at the end of the term. Ensure you have a credible repayment vehicle (ISA, pension, etc.).
        </div>
      )}

      {/* SDLT breakdown */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Stamp Duty Land Tax Breakdown (England &amp; N. Ireland)
        </p>
        <div className="space-y-2">
          {result.stampDutyBands.map((band, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <span>{formatGbp(band.from)} – {band.to >= 1_500_000 ? `${formatGbp(band.from)}+` : formatGbp(band.to)}</span>
              <span>{(band.rate * 100).toFixed(0)}%</span>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatGbp(band.tax)}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-black pt-1" style={{ color: 'var(--text-primary)' }}>
            <span>Total SDLT</span>
            <span>{formatGbp(result.totalStampDuty)}</span>
          </div>
        </div>
        <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
          Scotland uses Land and Buildings Transaction Tax (LBTT); Wales uses Land Transaction Tax (LTT) — rates differ.
        </p>
      </div>
    </div>
  );
}
