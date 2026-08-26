function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function holidaySet(holidays: string[]) {
  return new Set(holidays.filter(validDate));
}

export interface DateCountResult {
  totalDays: number;
  weekdays: number;
  weekends: number;
  holidays: number;
  error?: string;
}

export function countDaysBetween(start: string, end: string, includeEnd = false, holidays: string[] = []): DateCountResult {
  if (!validDate(start) || !validDate(end)) return { totalDays: 0, weekdays: 0, weekends: 0, holidays: 0, error: 'Enter two valid ISO dates.' };
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (endDate.getTime() < startDate.getTime()) return { totalDays: 0, weekdays: 0, weekends: 0, holidays: 0, error: 'End date must be on or after the start date.' };
  const excludedHolidays = holidaySet(holidays);
  const cursor = new Date(startDate);
  const limit = endDate.getTime() + (includeEnd ? 0 : -86400000);
  let totalDays = 0;
  let weekdays = 0;
  let weekends = 0;
  let holidayCount = 0;
  while (cursor.getTime() <= limit) {
    const dateKey = iso(cursor);
    const weekend = cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6;
    const holiday = excludedHolidays.has(dateKey);
    totalDays += 1;
    if (weekend) weekends += 1;
    else weekdays += 1;
    if (holiday) holidayCount += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return {
    totalDays,
    weekdays,
    weekends,
    holidays: holidayCount,
  };
}

export function businessDayCount(start: string, end: string, includeEnd = false, holidays: string[] = []) {
  const result = countDaysBetween(start, end, includeEnd, holidays);
  if (result.error) return { ...result, businessDays: 0 };
  const excludedHolidays = holidaySet(holidays);
  const cursor = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const limit = endDate.getTime() + (includeEnd ? 0 : -86400000);
  let count = 0;
  while (cursor.getTime() <= limit) {
    const key = iso(cursor);
    const weekend = cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6;
    if (!weekend && !excludedHolidays.has(key)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return { ...result, businessDays: count };
}

export function addCalendarDays(start: string, days: number, businessOnly = false, holidays: string[] = []) {
  if (!validDate(start) || !Number.isFinite(days)) return { date: '', error: 'Enter a valid date and a finite day offset.' };
  const amount = Math.trunc(days);
  if (!businessOnly) {
    const result = toDate(start);
    result.setUTCDate(result.getUTCDate() + amount);
    return { date: iso(result) };
  }
  const excludedHolidays = holidaySet(holidays);
  const direction = amount < 0 ? -1 : 1;
  let remaining = Math.abs(amount);
  const result = toDate(start);
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + direction);
    const key = iso(result);
    const weekend = result.getUTCDay() === 0 || result.getUTCDay() === 6;
    if (!weekend && !excludedHolidays.has(key)) remaining -= 1;
  }
  return { date: iso(result) };
}
