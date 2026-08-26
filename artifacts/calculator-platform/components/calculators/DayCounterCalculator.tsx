'use client';

import { useMemo, useState } from 'react';
import { addCalendarDays, businessDayCount, countDaysBetween } from '@/lib/calculators/dateAdvanced';
import { Field, inputClass, InputsPanel, ResultCard, ResultsPanel } from './ResultCard';

export function DayCounterCalculator() {
  const [start, setStart] = useState('2026-01-01');
  const [end, setEnd] = useState('2026-01-31');
  const [includeEnd, setIncludeEnd] = useState(false);
  const [holidayText, setHolidayText] = useState('');
  const [offsetStart, setOffsetStart] = useState('2026-01-01');
  const [offset, setOffset] = useState(15);
  const [businessOnly, setBusinessOnly] = useState(false);
  const holidays = useMemo(() => holidayText.split(',').map((value) => value.trim()).filter(Boolean), [holidayText]);
  const between = useMemo(() => countDaysBetween(start, end, includeEnd, holidays), [start, end, includeEnd, holidays]);
  const workdays = useMemo(() => businessDayCount(start, end, includeEnd, holidays), [start, end, includeEnd, holidays]);
  const offsetResult = useMemo(() => addCalendarDays(offsetStart, offset, businessOnly, holidays), [offsetStart, offset, businessOnly, holidays]);
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <InputsPanel title="Day Counter Inputs">
      <Field label="Start date" htmlFor="day-counter-start"><input id="day-counter-start" type="date" value={start} onChange={(event) => setStart(event.target.value)} className={inputClass} /></Field>
      <Field label="End date" htmlFor="day-counter-end"><input id="day-counter-end" type="date" value={end} onChange={(event) => setEnd(event.target.value)} className={inputClass} /></Field>
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><input type="checkbox" checked={includeEnd} onChange={(event) => setIncludeEnd(event.target.checked)} /> Include the end date</label>
      <Field label="Holiday dates (optional)" htmlFor="day-counter-holidays" hint="Enter comma-separated ISO dates such as 2026-01-19, 2026-12-25."><input id="day-counter-holidays" type="text" value={holidayText} onChange={(event) => setHolidayText(event.target.value)} className={inputClass} /></Field>
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Count from a date</p>
        <Field label="Offset start" htmlFor="day-counter-offset-start"><input id="day-counter-offset-start" type="date" value={offsetStart} onChange={(event) => setOffsetStart(event.target.value)} className={inputClass} /></Field>
        <Field label="Days to add or subtract" htmlFor="day-counter-offset"><input id="day-counter-offset" type="number" value={offset} onChange={(event) => setOffset(Number(event.target.value))} className={inputClass} /></Field>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><input type="checkbox" checked={businessOnly} onChange={(event) => setBusinessOnly(event.target.checked)} /> Count business days only</label>
      </div>
    </InputsPanel>
    <ResultsPanel title="Day Counter Results">
      <ResultCard highlight label="Calendar days" value={between.error ?? between.totalDays.toString()} />
      <ResultCard label="Weekdays" value={between.error ? '—' : between.weekdays.toString()} />
      <ResultCard label="Weekend days" value={between.error ? '—' : between.weekends.toString()} />
      <ResultCard label="Business days" value={workdays.error ? '—' : String(workdays.businessDays)} sub="Monday–Friday, excluding entered holidays." />
      <ResultCard highlight label="Offset date" value={offsetResult.error ?? offsetResult.date} />
      <ResultCard label="Entered holidays" value={holidays.length.toString()} />
    </ResultsPanel>
  </div>;
}
