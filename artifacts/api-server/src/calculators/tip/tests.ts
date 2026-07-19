import { calculateTip } from './formula';

export function runTests(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  try {
    const result = calculateTip({
      billAmount: 100,
      tipPercent: 18,
      splitPeople: 4
    });

    logs.push(`Test 1 (Bill $100, 18% tip, split 4): Total tip is $${result.tipAmount}, total per person is $${result.totalPerPerson}`);
    if (result.tipAmount !== 18) {
      throw new Error(`Expected tip to be $18, got $${result.tipAmount}`);
    }
    if (result.totalPerPerson !== 29.5) {
      throw new Error(`Expected total per person to be $29.5, got $${result.totalPerPerson}`);
    }

    logs.push('All Tip tests passed.');
    return { success: true, logs };
  } catch (err: any) {
    logs.push(`Test Failed: ${err.message}`);
    return { success: false, logs };
  }
}
