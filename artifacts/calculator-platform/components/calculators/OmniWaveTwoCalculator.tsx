'use client';

import { useMemo, useState } from 'react';
import { discountRate, linearCombination, pressureConvert, salaryToHourly } from '@/lib/calculators/omniWaveTwo';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

type Mode = 'pressure' | 'salary-to-hourly' | 'discount-rate' | 'linear-combination';

const numberField = (id: string, label: string, value: number, setValue: (value: number) => void, step = 0.01) => (
  <Field label={label} htmlFor={id}><input id={id} type="number" value={value} step={step} onChange={(e) => setValue(Number.isFinite(e.currentTarget.valueAsNumber) ? e.currentTarget.valueAsNumber : 0)} className={inputClass} /></Field>
);

export function OmniWaveTwoCalculator({ mode }: { mode: Mode }) {
  const [value, setValue] = useState(50);
  const [unit, setUnit] = useState<'bar' | 'psi' | 'atm' | 'pascal'>('bar');
  const [annual, setAnnual] = useState(50000);
  const [hours, setHours] = useState(40);
  const [weeks, setWeeks] = useState(52);
  const [pv, setPv] = useState(1000);
  const [fv, setFv] = useState(1500);
  const [periods, setPeriods] = useState(5);
  const [frequency, setFrequency] = useState(1);
  const [a1, setA1] = useState(1); const [b1, setB1] = useState(-4); const [c1, setC1] = useState(1);
  const [a2, setA2] = useState(-2); const [b2, setB2] = useState(4); const [c2, setC2] = useState(2);
  const title = mode === 'pressure' ? 'Pressure Unit Conversion' : mode === 'salary-to-hourly' ? 'Salary to Hourly Calculator' : mode === 'discount-rate' ? 'Discount Rate Calculator' : 'Linear Combination Calculator';
  const result = useMemo(() => {
    if (mode === 'pressure') return pressureConvert(value, unit);
    if (mode === 'salary-to-hourly') return salaryToHourly(annual, hours, weeks);
    if (mode === 'discount-rate') return { rate: discountRate(pv, fv, periods, frequency) };
    return linearCombination(a1, b1, c1, a2, b2, c2);
  }, [mode, value, unit, annual, hours, weeks, pv, fv, periods, frequency, a1, b1, c1, a2, b2, c2]);
  const pressureResult = result as ReturnType<typeof pressureConvert>;
  const salaryResult = result as ReturnType<typeof salaryToHourly>;
  const discountResult = result as { rate: number };
  const linearResult = result as ReturnType<typeof linearCombination>;
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <InputsPanel title={`${title} Inputs`}>
      {mode === 'pressure' && <>{numberField('pressure-value', 'Pressure value', value, setValue)}<Field label="Input unit" htmlFor="pressure-unit"><select id="pressure-unit" value={unit} onChange={(e) => setUnit(e.currentTarget.value as typeof unit)} className={inputClass}><option value="bar">bar</option><option value="psi">psi</option><option value="atm">atm</option><option value="pascal">Pa</option></select></Field></>}
      {mode === 'salary-to-hourly' && <>{numberField('salary-annual', 'Annual salary', annual, setAnnual, 100)}{numberField('salary-hours', 'Hours per week', hours, setHours)}{numberField('salary-weeks', 'Weeks per year', weeks, setWeeks, 1)}</>}
      {mode === 'discount-rate' && <>{numberField('discount-pv', 'Present value (PV)', pv, setPv, 1)}{numberField('discount-fv', 'Future value (FV)', fv, setFv, 1)}{numberField('discount-periods', 'Number of periods', periods, setPeriods, 1)}{numberField('discount-frequency', 'Compounding periods per period', frequency, setFrequency, 1)}</>}
      {mode === 'linear-combination' && <>{numberField('linear-a1', 'First equation — a₁', a1, setA1)}{numberField('linear-b1', 'First equation — b₁', b1, setB1)}{numberField('linear-c1', 'First equation — c₁', c1, setC1)}{numberField('linear-a2', 'Second equation — a₂', a2, setA2)}{numberField('linear-b2', 'Second equation — b₂', b2, setB2)}{numberField('linear-c2', 'Second equation — c₂', c2, setC2)}</>}
    </InputsPanel>
    <ResultsPanel title={`Live ${title} Results`}>
      {mode === 'pressure' && <><ResultCard highlight label="Pascals" value={pressureResult.pascal.toLocaleString(undefined, { maximumFractionDigits: 6 })} /><ResultCard label="Bar" value={pressureResult.bar.toFixed(6)} /><ResultCard label="PSI" value={pressureResult.psi.toFixed(6)} /><ResultCard label="Atmospheres" value={pressureResult.atm.toFixed(6)} /></>}
      {mode === 'salary-to-hourly' && <><ResultCard highlight label="Hourly wage" value={`$${salaryResult.hourly.toFixed(2)}`} /><ResultCard label="Weekly equivalent" value={`$${salaryResult.weekly.toFixed(2)}`} /><ResultCard label="Monthly equivalent" value={`$${salaryResult.monthly.toFixed(2)}`} /></>}
      {mode === 'discount-rate' && <ResultCard highlight label="Periodic discount rate" value={`${(discountResult.rate * 100).toFixed(6)}%`} sub="Calculated from PV, FV, periods, and compounding frequency." />}
      {mode === 'linear-combination' && <ResultCard highlight label="System result" value={linearResult.kind === 'unique' ? `x = ${linearResult.x.toFixed(6)}, y = ${linearResult.y.toFixed(6)}` : linearResult.kind === 'infinite' ? 'Infinitely many solutions' : 'No solution'} sub="The determinant guard distinguishes unique, inconsistent, and dependent systems." />}
    </ResultsPanel>
  </div>;
}

export const PressureUnitConversionCalculator = () => <OmniWaveTwoCalculator mode="pressure" />;
export const SalaryToHourlyCalculator = () => <OmniWaveTwoCalculator mode="salary-to-hourly" />;
export const DiscountRateCalculator = () => <OmniWaveTwoCalculator mode="discount-rate" />;
export const LinearCombinationCalculator = () => <OmniWaveTwoCalculator mode="linear-combination" />;
