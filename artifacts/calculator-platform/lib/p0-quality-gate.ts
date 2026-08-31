import { CALCULATOR_BY_SLUG, type CalculatorMeta } from '@/config/calculators';
import { CALCULATOR_CONTENT } from '@/config/calculator-content';

export type P0QualityResult = {
  slug: string;
  indexable: boolean;
  reasons: string[];
};

const P0 = new Set([
  'age',
  'bmi',
  'calorie',
  'height',
  'discount',
  'time',
  'basic',
]);

export function checkP0Quality(slug: string, calc?: CalculatorMeta): P0QualityResult {
  const base = slug.endsWith('-calculator') ? slug.slice(0, -11) : slug;
  const meta = calc ?? CALCULATOR_BY_SLUG[base];
  const content = CALCULATOR_CONTENT[base];
  const reasons: string[] = [];

  if (!P0.has(base)) reasons.push('not-p0');
  if (!meta) reasons.push('missing-calculator-meta');
  if (!content) reasons.push('missing-content');
  if (!meta?.name?.trim()) reasons.push('missing-name');
  if (!meta?.description?.trim()) reasons.push('missing-description');
  if (!meta?.keywords?.length) reasons.push('missing-keywords');
  if (!content?.howToSteps?.length) reasons.push('missing-how-to');
  if (!content?.formula?.expression?.trim()) reasons.push('missing-formula');
  if (!content?.examples?.length) reasons.push('missing-examples');
  if (!content?.faqs?.length) reasons.push('missing-faqs');

  return { slug: base, indexable: reasons.length === 0, reasons };
}

export function getIndexableP0Slugs(): string[] {
  return [...P0].filter((slug) => checkP0Quality(slug).indexable);
}
