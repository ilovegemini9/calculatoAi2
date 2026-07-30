import { LoanInput } from './formula';

export function validateLoanInput(input: LoanInput): string | null {
  if (input.loanAmount <= 0) {
    return 'Loan amount must be greater than zero.';
  }
  if (input.interestRate < 0 || input.interestRate > 100) {
    return 'Interest rate must be between 0% and 100%.';
  }
  if (input.term <= 0) {
    return 'Loan term must be greater than zero.';
  }
  if (input.termUnit === 'years' && input.term > 100) {
    return 'Loan term in years must be 100 or less.';
  }
  if (input.termUnit === 'months' && input.term > 1200) {
    return 'Loan term in months must be 1200 or less.';
  }
  return null;
}
