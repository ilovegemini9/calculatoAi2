'use client';
import { useMemo, useState } from 'react';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

type Mode = 'army-body-fat' | 'body-surface-area' | 'body-type' | 'pregnancy' | 'pregnancy-weight-gain';
export function ClinicalMetricsToolsCalculator({ mode }: { mode: Mode }) {
  const [weight, setWeight] = useState(70); const [height, setHeight] = useState(175); const [age, setAge] = useState(30); const [weeks, setWeeks] = useState(12);
  const title = mode === 'army-body-fat' ? 'Army Body Fat Calculator' : mode === 'body-surface-area' ? 'Body Surface Area Calculator' : mode === 'body-type' ? 'Body Type Calculator' : mode === 'pregnancy' ? 'Pregnancy Calculator' : 'Pregnancy Weight Gain Calculator';
  const x = useMemo(() => {
    if (mode === 'army-body-fat') return { primary: Math.max(0, 1.2 * (weight / (height / 100) ** 2) + 0.23 * age - 16.2), secondary: 0, label: 'Estimated body fat (%)' };
    if (mode === 'body-surface-area') return { primary: Math.sqrt(weight * height / 3600), secondary: 0, label: 'BSA (m²)' };
    if (mode === 'body-type') { const bmi = weight / (height / 100) ** 2; return { primary: bmi, secondary: bmi < 18.5 ? 1 : bmi < 25 ? 2 : 3, label: 'BMI / Type code' }; }
    if (mode === 'pregnancy') return { primary: 40 - weeks, secondary: Math.max(0, 40 - weeks) * 7, label: 'Approx. weeks remaining' };
    return { primary: 0.4 * weeks, secondary: 0.6 * weeks, label: 'Suggested gain range (kg)' };
  }, [mode, weight, height, age, weeks]);
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><InputsPanel title={`${title} Inputs`}><Field label="Weight (kg)" htmlFor={`${mode}-weight`}><input id={`${mode}-weight`} type="number" min={0} step={0.1} value={weight} onChange={e => setWeight(+e.target.value || 0)} className={inputClass}/></Field><Field label="Height (cm)" htmlFor={`${mode}-height`}><input id={`${mode}-height`} type="number" min={0} step={0.1} value={height} onChange={e => setHeight(+e.target.value || 0)} className={inputClass}/></Field><Field label={mode === 'pregnancy' || mode === 'pregnancy-weight-gain' ? 'Pregnancy weeks' : 'Age (years)'} htmlFor={`${mode}-third`}><input id={`${mode}-third`} type="number" min={0} value={mode === 'pregnancy' || mode === 'pregnancy-weight-gain' ? weeks : age} onChange={e => mode === 'pregnancy' || mode === 'pregnancy-weight-gain' ? setWeeks(+e.target.value || 0) : setAge(+e.target.value || 0)} className={inputClass}/></Field></InputsPanel><ResultsPanel title={`Live ${title} Results`}><ResultCard highlight label={x.label} value={x.primary.toFixed(2)} sub="Client-side estimate; not a diagnosis."/><ResultCard label="Reference / secondary" value={x.secondary.toFixed(2)}/><ResultCard label="Weight" value={`${weight} kg`}/></ResultsPanel></div>;
}
export const ArmyBodyFatCalculator = () => <ClinicalMetricsToolsCalculator mode="army-body-fat"/>; export const BodySurfaceAreaCalculator = () => <ClinicalMetricsToolsCalculator mode="body-surface-area"/>; export const BodyTypeCalculator = () => <ClinicalMetricsToolsCalculator mode="body-type"/>; export const PregnancyCalculator = () => <ClinicalMetricsToolsCalculator mode="pregnancy"/>; export const PregnancyWeightGainCalculator = () => <ClinicalMetricsToolsCalculator mode="pregnancy-weight-gain"/>;
