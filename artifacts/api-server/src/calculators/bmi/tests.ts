import { calculateBMI } from './formula';

export function runTests(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  try {
    const resultMetric = calculateBMI({
      system: 'metric',
      weight: 70,
      height: 175
    });
    logs.push(`Test 1 (Metric: 70kg, 175cm): Calculated BMI is ${resultMetric.bmi}`);
    // BMI should be 70 / (1.75^2) = 22.86 -> rounded to 22.9
    if (resultMetric.bmi !== 22.9) {
      throw new Error(`Expected BMI of 22.9, got ${resultMetric.bmi}`);
    }

    const resultImperial = calculateBMI({
      system: 'imperial',
      weight: 154,
      height: 70
    });
    logs.push(`Test 2 (Imperial: 154lbs, 70 inches): Calculated BMI is ${resultImperial.bmi}`);
    // BMI should be 703 * 154 / 4900 = 22.09 -> rounded to 22.1
    if (resultImperial.bmi !== 22.1) {
      throw new Error(`Expected BMI of 22.1, got ${resultImperial.bmi}`);
    }

    logs.push('All BMI tests passed.');
    return { success: true, logs };
  } catch (err: any) {
    logs.push(`Test Failed: ${err.message}`);
    return { success: false, logs };
  }
}
