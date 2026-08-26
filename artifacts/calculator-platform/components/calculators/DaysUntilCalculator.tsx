'use client';

import { useMemo, useState } from 'react';
import { daysUntil } from '@/lib/calculators/dateAdvanced';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

export function DaysUntilCalculator() {
  const [start, setStart] = useState('2026-08-26');
  const [target, setTarget] = useState('2026-11-24');
  const [includeStart, setIncludeStart] = useState(false);
  const result = useMemo(() => daysUntil(start, target, includeStart), [start, target, includeStart]);
  const directionLabel = result.direction === 'until' ? 'Days until target date' : result.direction === 'since' ? 'Days since target date' : 'Same date';
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <InputsPanel title="Days Until Inputs">
      <Field label="Start date" htmlFor="days-until-start"><input id="days-until-start" type="date" value={start} onChange={(event) => setStart(event.target.value)} className={inputClass} /></Field>
      <Field label="Target date" htmlFor="days-until-target"><input id="days-until-target" type="date" value={target} onChange={(event) => setTarget(event.target.value)} className={inputClass} /></Field>
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><input id="days-until-include-start" type="checkbox" checked={includeStart} onChange={(event) => setIncludeStart(event.target.checked)} /> Count the start day itself as day 1</label>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>The result counts whole calendar dates, not hours. Weekdays include Monday through Friday; public holidays are not removed.</p>
    </InputsPanel>
    <ResultsPanel title="Days Until Results">
      <ResultCard highlight label={directionLabel} value={result.error ?? `${result.days} day${result.days === 1 ? '' : 's'}`} />
      <ResultCard label="Weeks + days" value={result.error ? '—' : `${result.weeks} week${result.weeks === 1 ? '' : 's'}, ${result.remainderDays} day${result.remainderDays === 1 ? '' : 's'}`} />
      <ResultCard label="Calendar breakdown" value={result.error ? '—' : result.calendar} />
      <ResultCard label="Weekdays" value={result.error ? '—' : `${result.weekdays} days`} />
      <ResultCard label="Weekend days" value={result.error ? '—' : `${result.weekends} days`} sub="Use Day Counter for entered-holiday and business-day calculations." />
    </ResultsPanel>
  </div>;
}
