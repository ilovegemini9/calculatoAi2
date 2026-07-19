import { calculateLoan } from './formula';

export function runTests(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  try {
    const result = calculateLoan({
      loanAmount: 10000,
      interestRate: 6.0,
      term: 36,
      termUnit: 'months'
    });

    logs.push(`Test 1 (Loan: $10,000, 6%, 36 months): Monthly payment is $${result.monthlyPayment}`);
    // Standard P&I for $10k, 6%, 3 years = $304.22
    const diff = Math.abs(result.monthlyPayment - 304.22);
    if (diff > 2.0) {
      throw new Error(`Expected around $304.22, got $${result.monthlyPayment}`);
    }

    logs.push('All Loan tests passed.');
    return { success: true, logs };
  } catch (err: any) {
    logs.push(`Test Failed: ${err.message}`);
    return { success: false, logs };
  }
}
