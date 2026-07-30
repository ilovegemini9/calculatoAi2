import { calculateAge } from './formula';

export function runTests(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  try {
    const result = calculateAge({
      birthDate: '1990-06-15',
      targetDate: '2020-06-15'
    });

    logs.push(`Test 1 (Birth 1990-06-15, Target 2020-06-15): Calculated years is ${result.years}, months is ${result.months}, days is ${result.days}`);
    if (result.years !== 30 || result.months !== 0 || result.days !== 0) {
      throw new Error(`Expected exactly 30 years, 0 months, 0 days. Got ${result.years}y, ${result.months}m, ${result.days}d`);
    }

    logs.push('All Age tests passed.');
    return { success: true, logs };
  } catch (err: any) {
    logs.push(`Test Failed: ${err.message}`);
    return { success: false, logs };
  }
}
