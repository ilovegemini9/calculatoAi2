import assert from 'node:assert/strict';
import { addCalendarDays, businessDayCount, countDaysBetween } from '../lib/calculators/dateAdvanced';

const exclusive = countDaysBetween('2026-01-01', '2026-01-03', false);
assert.equal(exclusive.totalDays, 2);
assert.equal(exclusive.weekdays, 2);
assert.equal(exclusive.weekends, 0);

const inclusive = countDaysBetween('2026-01-01', '2026-01-03', true);
assert.equal(inclusive.totalDays, 3);
assert.equal(inclusive.weekdays, 2);
assert.equal(inclusive.weekends, 1);

const withHoliday = businessDayCount('2026-01-01', '2026-01-05', true, ['2026-01-01']);
assert.equal(withHoliday.businessDays, 2);
assert.equal(withHoliday.holidays, 1);

assert.equal(addCalendarDays('2026-01-02', 3).date, '2026-01-05');
assert.equal(addCalendarDays('2026-01-02', 1, true).date, '2026-01-05');
assert.equal(addCalendarDays('2026-01-05', -1, true).date, '2026-01-02');
assert.ok(countDaysBetween('2026-01-05', '2026-01-01').error);

console.log('Date counter production tests passed');
