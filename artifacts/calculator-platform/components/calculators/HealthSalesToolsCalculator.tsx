'use client';
import { useMemo, useState } from 'react';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';
import { formatCurrency } from '@/lib/utils';

type Mode = 'commission' | 'vat' | 'anorexic-bmi';
export function HealthSalesToolsCalculator({ mode }: { mode: Mode }) {
  const [a, setA] = useState(1000); const [b, setB] = useState(10); const [h, setH] = useState(1.7); const [w, setW] = useState(60);
  const title = mode === 'commission' ? 'Commission Calculator' : mode === 'vat' ? 'VAT Calculator' : 'Anorexic BMI Calculator';
  const result = useMemo(() => {
    if (mode === 'commission') return { primary: a * b / 100, secondary: a + a * b / 100, label: 'Commission' };
    if (mode === 'vat') return { primary: a * b / 100, secondary: a + a * b / 100, label: 'VAT Amount' };
    const bmi = h > 0 ? w / (h * h) : 0; return { primary: bmi, secondary: bmi < 18.5 ? 1 : 0, label: 'BMI' };
  }, [mode, a, b, h, w]);
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><InputsPanel title={`${title} Inputs`}>
    {mode !== 'anorexic-bmi' ? <><Field label="Base Amount ($)" htmlFor={`${mode}-amount`}><input id={`${mode}-amount`} type="number" min={0} step={0.01} value={a} onChange={e => setA(+e.target.value || 0)} className={inputClass}/></Field><Field label={mode === 'vat' ? 'VAT Rate (%)' : 'Commission Rate (%)'} htmlFor={`${mode}-rate`}><input id={`${mode}-rate`} type="number" min={0} step={0.01} value={b} onChange={e => setB(+e.target.value || 0)} className={inputClass}/></Field></> : <><Field label="Weight (kg)" htmlFor="anorexic-bmi-weight"><input id="anorexic-bmi-weight" type="number" min={0} step={0.1} value={w} onChange={e => setW(+e.target.value || 0)} className={inputClass}/></Field><Field label="Height (m)" htmlFor="anorexic-bmi-height"><input id="anorexic-bmi-height" type="number" min={0.1} step={0.01} value={h} onChange={e => setH(+e.target.value || 0)} className={inputClass}/></Field></>}
  </InputsPanel><ResultsPanel title={`Live ${title} Results`}><ResultCard highlight label={result.label} value={mode === 'anorexic-bmi' ? result.primary.toFixed(2) : formatCurrency(result.primary)} sub="Results computed instantly — your data never leaves your device."/><ResultCard label={mode === 'anorexic-bmi' ? 'Underweight flag (1=yes)' : 'Total / Net Amount'} value={mode === 'anorexic-bmi' ? String(result.secondary) : formatCurrency(result.secondary)}/><ResultCard label="Input" value={mode === 'anorexic-bmi' ? `${w} kg` : formatCurrency(a)}/></ResultsPanel></div>;
}
export const CommissionCalculator = () => <HealthSalesToolsCalculator mode="commission"/>;
export const VatCalculator = () => <HealthSalesToolsCalculator mode="vat"/>;
export const AnorexicBmiCalculator = () => <HealthSalesToolsCalculator mode="anorexic-bmi"/>;
