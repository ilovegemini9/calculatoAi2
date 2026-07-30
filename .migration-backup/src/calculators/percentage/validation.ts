import { PercentageInput } from './formula';

export function validatePercentageInput(input: PercentageInput): string | null {
  if (isNaN(input.x) || isNaN(input.y)) {
    return 'Please enter valid numbers for both fields.';
  }
  if (input.caseType === 'whatPercentOf' && input.x === 0) {
    return 'The first number (X) cannot be zero for division.';
  }
  if (input.caseType === 'change' && input.x === 0) {
    return 'The starting number (X) cannot be zero for percentage change.';
  }
  return null;
}
