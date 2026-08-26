'use client';

import { useMemo, useState } from 'react';
import { emergencyFund } from '@/lib/calculators/financeExtras';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

function dollars(value: number) {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function EmergencyFundCalculator() {
  const [expenses, setExpenses] = useState(3500);
  const [targetMonths, setTargetMonths] = useState(6);
  const [currentSavings, setCurrentSavings] = useState(7000);
  const [contribution, setContribution] = useState(1000);
  const result = useMemo(() => emergencyFund(expenses, targetMonths, currentSavings, contribution), [expenses, targetMonths, currentSavings, contribution]);
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <InputsPanel title="Emergency Fund Inputs">
      <Field label="Monthly essential expenses" htmlFor="emergency-expenses" hint="Use needs such as housing, utilities, groceries, insurance, and minimum debt payments."><input id="emergency-expenses" type="number" min={0} step={50} value={expenses} onChange={(event) => setExpenses(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Target coverage (months)" htmlFor="emergency-months"><input id="emergency-months" type="number" min={0} step={1} value={targetMonths} onChange={(event) => setTargetMonths(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Current savings" htmlFor="emergency-savings"><input id="emergency-savings" type="number" min={0} step={50} value={currentSavings} onChange={(event) => setCurrentSavings(Number(event.target.value))} className={inputClass} /></Field>
      <Field label="Monthly contribution" htmlFor="emergency-contribution" hint="Use zero if you want to see that the gap has no scheduled payoff time."><input id="emergency-contribution" type="number" min={0} step={25} value={contribution} onChange={(event) => setContribution(Number(event.target.value))} className={inputClass} /></Field>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>This is a planning estimate, not financial advice. Your target depends on job stability, household needs, insurance, and access to liquid cash.</p>
    </InputsPanel>
    <ResultsPanel title="Emergency Fund Results">
      <ResultCard highlight label="Emergency fund target" value={result.error ?? dollars(result.targetAmount)} />
      <ResultCard label="Savings gap" value={result.error ? '—' : dollars(result.savingsGap)} />
      <ResultCard label="Time to goal" value={result.error ? '—' : result.monthsToGoal === null ? 'No scheduled payoff' : `${result.monthsToGoal} month${result.monthsToGoal === 1 ? '' : 's'}`} />
      <ResultCard label="Current savings" value={dollars(currentSavings)} />
      <ResultCard label="Current coverage" value={result.error ? '—' : `${result.currentCoverageMonths.toFixed(1)} months`} />
    </ResultsPanel>
  </div>;
}
