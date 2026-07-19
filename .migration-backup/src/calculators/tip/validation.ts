import { TipInput } from './formula';

export function validateTipInput(input: TipInput): string | null {
  if (input.billAmount <= 0) {
    return 'Bill amount must be greater than zero.';
  }
  if (input.tipPercent < 0 || input.tipPercent > 500) {
    return 'Tip percentage must be between 0% and 500%.';
  }
  if (input.splitPeople <= 0 || input.splitPeople > 1000) {
    return 'Number of people must be between 1 and 1000.';
  }
  return null;
}
