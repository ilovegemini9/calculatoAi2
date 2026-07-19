import { calculateCalorie } from './formula';

export function runTests(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  try {
    const result = calculateCalorie({
      system: 'metric',
      age: 25,
      gender: 'male',
      weight: 70,
      height: 175,
      activity: 'sedentary'
    });

    logs.push(`Test 1 (Metric Male, 25, 70kg, 175cm, sedentary): BMR: ${result.bmr}, TDEE: ${result.tdee}`);
    // BMR = 10 * 70 + 6.25 * 175 - 5 * 25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> rounded to 1674
    if (result.bmr !== 1674) {
      throw new Error(`Expected BMR of 1674, got ${result.bmr}`);
    }
    // TDEE = 1674 * 1.2 = 2008.8 -> rounded to 2009
    if (result.tdee !== 2009) {
      throw new Error(`Expected TDEE of 2009, got ${result.tdee}`);
    }

    logs.push('All Calorie tests passed.');
    return { success: true, logs };
  } catch (err: any) {
    logs.push(`Test Failed: ${err.message}`);
    return { success: false, logs };
  }
}
