import { MortgageInput } from './formula';

export function validateMortgageInput(input: MortgageInput): string | null {
  if (input.homePrice <= 0) {
    return 'Home price must be greater than zero.';
  }
  if (input.downPayment < 0) {
    return 'Down payment cannot be negative.';
  }
  if (input.downPayment >= input.homePrice) {
    return 'Down payment must be less than the home price.';
  }
  if (input.interestRate < 0 || input.interestRate > 100) {
    return 'Interest rate must be between 0% and 100%.';
  }
  if (input.loanTermYears <= 0 || input.loanTermYears > 100) {
    return 'Loan term must be a realistic number of years (1 to 100).';
  }
  return null;
}
