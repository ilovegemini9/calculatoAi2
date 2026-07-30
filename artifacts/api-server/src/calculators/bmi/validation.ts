import { BMIInput } from './formula';

export function validateBMIInput(input: BMIInput): string | null {
  if (input.weight <= 0) {
    return 'Weight must be greater than zero.';
  }
  if (input.height <= 0) {
    return 'Height must be greater than zero.';
  }
  if (input.system === 'metric') {
    if (input.height < 50 || input.height > 300) {
      return 'Height must be between 50 cm and 300 cm.';
    }
    if (input.weight < 10 || input.weight > 600) {
      return 'Weight must be between 10 kg and 600 kg.';
    }
  } else {
    if (input.height < 20 || input.height > 120) {
      return 'Height must be between 20 inches and 120 inches.';
    }
    if (input.weight < 20 || input.weight > 1300) {
      return 'Weight must be between 20 lbs and 1300 lbs.';
    }
  }
  return null;
}
