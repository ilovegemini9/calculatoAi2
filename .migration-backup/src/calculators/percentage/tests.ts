import { calculatePercentage } from './formula';

export function runTests(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  try {
    const res1 = calculatePercentage({
      caseType: 'percentOf',
      x: 15,
      y: 200
    });
    logs.push(`Test 1 (15% of 200): Got ${res1.result}`);
    if (res1.result !== 30) {
      throw new Error(`Expected 30, got ${res1.result}`);
    }

    const res2 = calculatePercentage({
      caseType: 'whatPercentOf',
      x: 80,
      y: 20
    });
    logs.push(`Test 2 (what percent of 80 is 20): Got ${res2.result}`);
    if (res2.result !== 25) {
      throw new Error(`Expected 25, got ${res2.result}`);
    }

    const res3 = calculatePercentage({
      caseType: 'change',
      x: 100,
      y: 150
    });
    logs.push(`Test 3 (change from 100 to 150): Got ${res3.result}%`);
    if (res3.result !== 50) {
      throw new Error(`Expected 50, got ${res3.result}`);
    }

    logs.push('All percentage tests passed.');
    return { success: true, logs };
  } catch (err: any) {
    logs.push(`Test Failed: ${err.message}`);
    return { success: false, logs };
  }
}
