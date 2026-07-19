'use client';

import { useState } from 'react';
import { calculateAge } from '@/lib/calculators/age/formula';
import { ResultCard, ResultsPanel, InputsPanel, Field, inputClass } from './ResultCard';
import { formatNumber } from '@/lib/utils';

export function AgeCalculator() {
  const today = new Date().toISOString().split('T')[0];
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [targetDate, setTargetDate] = useState(today);

  const result = birthDate && targetDate && birthDate <= targetDate
    ? calculateAge({ birthDate, targetDate })
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InputsPanel>
        <Field label="Date of Birth">
          <input type="date" value={birthDate} max={today}
            onChange={e => setBirthDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Age at Date">
          <input type="date" value={targetDate} min={birthDate} max="2100-12-31"
            onChange={e => setTargetDate(e.target.value)} className={inputClass} />
        </Field>
      </InputsPanel>

      <ResultsPanel>
        {result ? (
          <>
            <ResultCard highlight label="Age" value={`${result.years} yrs, ${result.months} mo, ${result.days} d`} />
            <ResultCard label="Total Days" value={formatNumber(result.totalDays, 0)} />
            <ResultCard label="Total Weeks" value={formatNumber(result.totalWeeks, 0)} />
            <ResultCard label="Total Months" value={formatNumber(result.totalMonths, 0)} />
            <ResultCard label="Total Hours" value={formatNumber(result.totalHours, 0)} />
            <ResultCard label="Next Birthday In" value={result.nextBirthdayDays === 0 ? '🎉 Today!' : `${result.nextBirthdayDays} days (${result.nextBirthdayWeekday})`} />
          </>
        ) : (
          <p className="col-span-2 text-center text-slate-600 text-sm py-6">Enter dates above to see results</p>
        )}
      </ResultsPanel>
    </div>
  );
}
