import { AgeInput } from './formula';

export function validateAgeInput(input: AgeInput): string | null {
  if (!input.birthDate) {
    return 'Please enter a valid birth date.';
  }
  if (!input.targetDate) {
    return 'Please enter a valid target date.';
  }
  
  const birth = new Date(input.birthDate);
  const target = new Date(input.targetDate);

  if (isNaN(birth.getTime())) {
    return 'Birth date is not a valid date.';
  }
  if (isNaN(target.getTime())) {
    return 'Target date is not a valid date.';
  }
  if (birth > target) {
    return 'Birth date cannot be after the target calculation date.';
  }
  return null;
}
