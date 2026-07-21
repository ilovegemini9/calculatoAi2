import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge } from '../lib/calculators/age/formula';

describe('calculateAge — standard case (1990-01-15 → 2026-07-20)', () => {
  // Reference: CALCULATOR_CONTENT worked example
  // 36 years, 6 months, 5 days, 13335 total days
  const r = calculateAge({ birthDate: '1990-01-15', targetDate: '2026-07-20' });

  it('years = 36', () => assert.strictEqual(r.years, 36));
  it('months = 6', () => assert.strictEqual(r.months, 6));
  it('days = 5', () => assert.strictEqual(r.days, 5));
  it('totalDays = 13335', () => assert.strictEqual(r.totalDays, 13335));
  it('totalWeeks = 1905', () => assert.strictEqual(r.totalWeeks, 1905));
  it('totalHours = 320040', () => assert.strictEqual(r.totalHours, 320040));
  it('totalMinutes = 19202400', () => assert.strictEqual(r.totalMinutes, 19202400));
  it('totalMonths = 438', () => assert.strictEqual(r.totalMonths, 438));
});

describe('calculateAge — same-day (zero age)', () => {
  const r = calculateAge({ birthDate: '2000-06-15', targetDate: '2000-06-15' });

  it('all duration fields are 0', () => {
    assert.strictEqual(r.years, 0);
    assert.strictEqual(r.months, 0);
    assert.strictEqual(r.days, 0);
    assert.strictEqual(r.totalDays, 0);
    assert.strictEqual(r.totalWeeks, 0);
    assert.strictEqual(r.totalHours, 0);
    assert.strictEqual(r.totalMinutes, 0);
  });

  it('nextBirthdayDays = 0 when birthday is today', () => {
    assert.strictEqual(r.nextBirthdayDays, 0);
  });
});

describe('calculateAge — exact round year', () => {
  it('1990-06-15 → 2000-06-15 = 10 years exactly', () => {
    const r = calculateAge({ birthDate: '1990-06-15', targetDate: '2000-06-15' });
    assert.strictEqual(r.years, 10);
    assert.strictEqual(r.months, 0);
    assert.strictEqual(r.days, 0);
  });
});

describe('calculateAge — month/day rollover', () => {
  it('born Jan 31, target Feb 28 → borrows from previous month', () => {
    const r = calculateAge({ birthDate: '2000-01-31', targetDate: '2024-02-28' });
    assert.strictEqual(r.years, 24);
    assert.ok(r.months >= 0 && r.months <= 11);
    assert.ok(r.days >= 0);
  });
});

describe('calculateAge — leap year', () => {
  it('2000-02-29 → 2004-02-29 = exactly 4 years', () => {
    const r = calculateAge({ birthDate: '2000-02-29', targetDate: '2004-02-29' });
    assert.strictEqual(r.years, 4);
    assert.strictEqual(r.months, 0);
    assert.strictEqual(r.days, 0);
  });
});

describe('calculateAge — next birthday', () => {
  it('nextBirthdayDays > 0 when birthday is in the future', () => {
    const r = calculateAge({ birthDate: '2000-12-31', targetDate: '2026-07-20' });
    assert.ok(r.nextBirthdayDays > 0);
  });

  it('nextBirthdayWeekday is a valid weekday', () => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const r = calculateAge({ birthDate: '1990-01-15', targetDate: '2026-07-20' });
    assert.ok(weekdays.includes(r.nextBirthdayWeekday));
  });
});
