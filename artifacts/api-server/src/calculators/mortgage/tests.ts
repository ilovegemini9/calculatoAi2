import { calculateMortgage } from './formula';

export function runTests(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  try {
    const result30Yr = calculateMortgage({
      homePrice: 400000,
      downPayment: 80000,
      interestRate: 6.5,
      loanTermYears: 30
    });

    logs.push(`Test 1 (Standard 30Yr, 20% down): Monthly P&I calculated is $${result30Yr.monthlyPrincipalAndInterest}`);
    // Monthly P&I for $320k principal at 6.5% for 30 years should be around $2022.62
    const diff = Math.abs(result30Yr.monthlyPrincipalAndInterest - 2022.62);
    if (diff > 5.0) {
      throw new Error(`Expected around $2022.62, got $${result30Yr.monthlyPrincipalAndInterest}`);
    }
    
    logs.push('Test 1 Passed: Formula matches standard mortgage amortization math.');
    return { success: true, logs };
  } catch (err: any) {
    logs.push(`Test Failed: ${err.message}`);
    return { success: false, logs };
  }
}
