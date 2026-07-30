import { GPAInput } from './formula';

export function validateGPAInput(input: GPAInput): string | null {
  if (input.courses.length === 0) {
    return 'Please add at least one course to calculate GPA.';
  }
  for (let i = 0; i < input.courses.length; i++) {
    const course = input.courses[i];
    if (course.credits <= 0) {
      return `Course ${i + 1} (${course.name || 'Unnamed'}) has invalid credits. Credits must be greater than zero.`;
    }
  }
  return null;
}
