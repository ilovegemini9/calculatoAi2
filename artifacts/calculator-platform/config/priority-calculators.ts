export type CalculatorPriority = 'P0' | 'P1';

/**
 * First-wave calculators selected for the fastest path toward meaningful organic traffic.
 * This file is intentionally separate from the master catalog so prioritization can change
 * without mutating calculator metadata.
 */
export const PRIORITY_CALCULATORS: Array<{
  slug: string;
  priority: CalculatorPriority;
  cluster: 'health' | 'money' | 'utility' | 'gaming' | 'core';
}> = [
  { slug: 'age', priority: 'P0', cluster: 'health' },
  { slug: 'bmi', priority: 'P0', cluster: 'health' },
  { slug: 'calorie', priority: 'P0', cluster: 'health' },
  { slug: 'height', priority: 'P0', cluster: 'health' },
  { slug: 'discount', priority: 'P0', cluster: 'money' },
  { slug: 'time', priority: 'P0', cluster: 'utility' },
  { slug: 'margin', priority: 'P1', cluster: 'money' },
  { slug: 'minecraft-circle-generator', priority: 'P1', cluster: 'gaming' },
  { slug: 'calculator', priority: 'P1', cluster: 'core' },
];

export const PRIORITY_SLUGS = new Set(PRIORITY_CALCULATORS.map(({ slug }) => slug));

export function getCalculatorPriority(slug: string): CalculatorPriority | null {
  return PRIORITY_CALCULATORS.find((item) => item.slug === slug)?.priority ?? null;
}
