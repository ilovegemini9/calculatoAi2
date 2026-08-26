'use client';

import { useMemo, useState } from 'react';
import { calculateCagr, loanToValue, splitBill, type CagrMode } from '@/lib/calculators/financeExtras';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

type Mode = 'cagr' | 'ltv' | 'bill-split';

function money(value: number) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceParityCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(mode === 'bill-split' ? 250 : mode === 'ltv' ? 320000 : 1000);
  const [b, setB] = useState(mode === 'bill-split' ? 10 : mode === 'ltv' ? 400000 : 1300);
  const [c, setC] = useState(mode === 'bill-split' ? 4 : 3);
  const [d, setD] = useState(mode === 'bill-split' ? 0 : 0);
  const [cagrMode, setCagrMode] = useState<CagrMode>('cagr');
  const result = useMemo(() => {
    if (mode === 'cagr') return calculateCagr(cagrMode, a, b, c, d);
    if (mode === 'ltv') return loanToValue(a, b, d);
    return splitBill(a, b, c, d);
  }, [mode, cagrMode, a, b, c, d]);
  const title = mode === 'cagr' ? 'CAGR Calculator' : mode === 'ltv' ? 'Loan-to-Value Calculator' : 'Bill Split Calculator';
  if (mode === 'cagr') {
    const cagrResult = result as ReturnType<typeof calculateCagr>;
    const primaryLabel = cagrMode === 'cagr' ? 'CAGR' : cagrMode === 'future-value' ? 'Future value' : 'Initial value';
    return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel title="CAGR Inputs">
        <Field label="Mode" htmlFor="cagr-mode"><select id="cagr-mode" value={cagrMode} onChange={(event) => setCagrMode(event.target.value as CagrMode)} className={inputClass}><option value="cagr">Calculate CAGR</option><option value="future-value">Find future value</option><option value="initial-value">Find initial value</option></select></Field>
        <Field label="Initial value" htmlFor="cagr-initial"><input id="cagr-initial" type="number" min={0} step={100} value={a} onChange={(event) => setA(Number(event.target.value))} className={inputClass} /></Field>
        <Field label="Final value" htmlFor="cagr-final"><input id="cagr-final" type="number" min={0} step={100} value={b} onChange={(event) => setB(Number(event.target.value))} className={inputClass} /></Field>
        <Field label="Number of years" htmlFor="cagr-years"><input id="cagr-years" type="number" min={0} step={1} value={c} onChange={(event) => setC(Number(event.target.value))} className={inputClass} /></Field>
        {cagrMode !== 'cagr' && <Field label="Annual rate (%)" htmlFor="cagr-rate"><input id="cagr-rate" type="number" step={0.1} value={d} onChange={(event) => setD(Number(event.target.value))} className={inputClass} /></Field>}
      </InputsPanel>
      <ResultsPanel title="CAGR Results">
        <ResultCard highlight label={primaryLabel} value={cagrResult.error ?? (cagrMode === 'cagr' ? `${cagrResult.result.toFixed(2)}%` : money(cagrResult.result))} />
        <ResultCard label="Total growth" value={cagrResult.error ? '—' : `${cagrResult.totalGrowthPercent.toFixed(2)}%`} />
        <ResultCard label="Period" value={`${c} year${c === 1 ? '' : 's'}`} sub="CAGR smooths a path into one annualized rate; it does not describe volatility or interim cash flows." />
      </ResultsPanel>
    </div>;
  }
  if (mode === 'ltv') {
    const ltvResult = result as ReturnType<typeof loanToValue>;
    return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel title="Loan-to-Value Inputs">
        <Field label="Loan amount" htmlFor="ltv-loan"><input id="ltv-loan" type="number" min={0} step={1000} value={a} onChange={(event) => setA(Number(event.target.value))} className={inputClass} /></Field>
        <Field label="Property value" htmlFor="ltv-property"><input id="ltv-property" type="number" min={0} step={1000} value={b} onChange={(event) => setB(Number(event.target.value))} className={inputClass} /></Field>
        <Field label="Additional liens (optional)" htmlFor="ltv-second-lien" hint="Used for an educational combined loan-to-value estimate."><input id="ltv-second-lien" type="number" min={0} step={1000} value={d} onChange={(event) => setD(Number(event.target.value))} className={inputClass} /></Field>
      </InputsPanel>
      <ResultsPanel title="Loan-to-Value Results">
        <ResultCard highlight label="LTV ratio" value={ltvResult.error ?? `${ltvResult.ltvPercent.toFixed(2)}%`} />
        <ResultCard label="Equity amount" value={ltvResult.error ? '—' : money(ltvResult.equityAmount)} />
        <ResultCard label="Equity percentage" value={ltvResult.error ? '—' : `${ltvResult.equityPercent.toFixed(2)}%`} />
        <ResultCard label="Combined LTV" value={ltvResult.error ? '—' : `${ltvResult.cltvPercent.toFixed(2)}%`} sub="Lender thresholds, PMI, and approval rules vary by program and jurisdiction." />
      </ResultsPanel>
    </div>;
  }
  const billResult = result as ReturnType<typeof splitBill>;
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <InputsPanel title="Bill Split Inputs">
      <Field label="Total bill" htmlFor="bill-split-total"><input id="bill-split-total" type="number" min={0} step={1} value={a} onChange={(event) => setA(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Tip percentage" htmlFor="bill-split-tip"><input id="bill-split-tip" type="number" min={0} step={1} value={b} onChange={(event) => setB(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="People" htmlFor="bill-split-people"><input id="bill-split-people" type="number" min={1} step={1} value={c} onChange={(event) => setC(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Service charge" htmlFor="bill-split-service"><input id="bill-split-service" type="number" min={0} step={1} value={d} onChange={(event) => setD(Number(event.target.value))} className={inputClass} /></Field>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>This route models an equal split. Check the receipt because service charges and gratuity can be sequenced differently.</p>
    </InputsPanel>
    <ResultsPanel title="Bill Split Results">
      <ResultCard highlight label="Per person" value={money(billResult.perPerson)} />
      <ResultCard label="Grand total" value={money(billResult.grandTotal)} />
      <ResultCard label="Tip amount" value={money(billResult.tipAmount)} />
      <ResultCard label="Adjusted bill" value={money(billResult.adjustedBill)} sub={`${billResult.people} people; service charge is included before tip in this model.`} />
    </ResultsPanel>
  </div>;
}

export const CagrCalculator = () => <FinanceParityCalculator mode="cagr" />;
export const LoanToValueCalculator = () => <FinanceParityCalculator mode="ltv" />;
export const BillSplitCalculator = () => <FinanceParityCalculator mode="bill-split" />;
