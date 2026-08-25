'use client';
import { useMemo, useState } from 'react';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

type Mode = 'estate-tax' | 'finance' | 'pension' | 'social-security' | 'currency';

export function MacroFinanceToolsCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(500000);
  const [b, setB] = useState(100000);
  const [r, setR] = useState(20);
  const [t, setT] = useState(20);
  const title = mode === 'estate-tax' ? 'Estate Tax Calculator' : mode === 'finance' ? 'Finance Calculator' : mode === 'pension' ? 'Pension Calculator' : mode === 'social-security' ? 'Social Security Calculator' : 'Currency Calculator';
  const result = useMemo(() => {
    if (mode === 'estate-tax') { const taxable = Math.max(a - b, 0); return { primary: taxable * r / 100, secondary: taxable, label: 'Estimated Estate Tax' }; }
    if (mode === 'finance') { const monthly = r / 100 / 12; const n = Math.max(t * 12, 0); const payment = monthly === 0 ? (n ? a / n : 0) : (n ? a * monthly / (1 - (1 + monthly) ** -n) : 0); return { primary: payment, secondary: payment * n - a, label: 'Monthly Payment' }; }
    if (mode === 'pension') { const monthly = a * (1 + r / 100 / 12) ** (t * 12) + b * (((1 + r / 100 / 12) ** (t * 12) - 1) / (r / 100 / 12 || 1)); return { primary: monthly, secondary: monthly * 0.04 / 12, label: 'Projected Pension Fund' }; }
    if (mode === 'social-security') { const capped = Math.min(a, b); return { primary: capped * r / 100 / 12, secondary: capped, label: 'Estimated Monthly Benefit' }; }
    return { primary: a * r, secondary: a * (r - 1), label: 'Converted Amount' };
  }, [mode, a, b, r, t]);
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <InputsPanel title={`${title} Inputs`}>
      <Field label={mode === 'currency' ? 'Amount' : mode === 'social-security' ? 'Average Monthly Earnings ($)' : 'Starting Amount ($)'} htmlFor={`${mode}-amount`}><input id={`${mode}-amount`} type="number" min={0} step={0.01} value={a} onChange={e => setA(+e.target.value || 0)} className={inputClass} /></Field>
      <Field label={mode === 'estate-tax' ? 'Exemption ($)' : mode === 'social-security' ? 'Earnings Cap ($)' : mode === 'currency' ? 'Exchange Rate' : 'Monthly Contribution ($)'} htmlFor={`${mode}-secondary`}><input id={`${mode}-secondary`} type="number" min={0} step={0.01} value={b} onChange={e => setB(+e.target.value || 0)} className={inputClass} /></Field>
      <Field label={mode === 'currency' ? 'Target Units per Unit' : mode === 'estate-tax' || mode === 'social-security' ? 'Rate (%)' : 'Annual Rate (%)'} htmlFor={`${mode}-rate`}><input id={`${mode}-rate`} type="number" min={0} step={0.01} value={r} onChange={e => setR(+e.target.value || 0)} className={inputClass} /></Field>
      {mode !== 'estate-tax' && mode !== 'social-security' && mode !== 'currency' && <Field label="Years" htmlFor={`${mode}-years`}><input id={`${mode}-years`} type="number" min={0} value={t} onChange={e => setT(+e.target.value || 0)} className={inputClass} /></Field>}
    </InputsPanel>
    <ResultsPanel title={`Live ${title} Results`}><ResultCard highlight label={result.label} value={formatCurrency(result.primary)} sub="Results computed instantly — your data never leaves your device." /><ResultCard label="Secondary Measure" value={formatCurrency(result.secondary)} /><ResultCard label="Primary Input" value={formatCurrency(a)} /></ResultsPanel>
  </div>;
}
export const EstateTaxCalculator = () => <MacroFinanceToolsCalculator mode="estate-tax" />;
export const FinanceCalculator = () => <MacroFinanceToolsCalculator mode="finance" />;
export const PensionCalculator = () => <MacroFinanceToolsCalculator mode="pension" />;
export const SocialSecurityCalculator = () => <MacroFinanceToolsCalculator mode="social-security" />;
export const CurrencyCalculator = () => <MacroFinanceToolsCalculator mode="currency" />;
