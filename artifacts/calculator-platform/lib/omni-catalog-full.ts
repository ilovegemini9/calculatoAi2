import type { CalculatorMeta } from '@/config/calculators';
import { CALCULATORS } from '@/config/calculators';
import type { CalcContent } from '@/config/calculator-content';
import omniData from '@/config/omni-full-database.json';

export interface OmniCalculatorEntry {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  icon: string;
  description: string;
  keywords: string[];
  inputs: Array<{
    name: string;
    label: string;
    type: 'number' | 'text' | 'select';
    defaultValue?: number | string;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    helpText?: string;
  }>;
  outputs: Array<{ name: string; label: string; suffix?: string; highlight?: boolean }>;
  formula: { expression: string; variables: Array<{ symbol: string; definition: string }>; notes?: string };
  howToSteps: string[];
  faqs: Array<{ question: string; answer: string }>;
  examples: Array<{ title: string; scenario: string; steps: string[]; result: string }>;
}

const rawOmniList = (omniData && Array.isArray((omniData as { calculators?: unknown[] }).calculators)
  ? (omniData as { calculators: OmniCalculatorEntry[] }).calculators
  : []) as OmniCalculatorEntry[];

const omniCalculators: OmniCalculatorEntry[] = rawOmniList.length > 0 ? rawOmniList : CALCULATORS.map((calculator: CalculatorMeta) => ({
  ...calculator,
  inputs: [],
  outputs: [{ name: 'result', label: 'Result', highlight: true }],
  formula: { expression: 'See calculator inputs', variables: [] },
  howToSteps: [`Enter the values required by the ${calculator.name}.`, 'Calculate to see the result.'],
  faqs: [],
  examples: [],
}));

const omniBySlugMap = new Map<string, OmniCalculatorEntry>();
for (const item of omniCalculators) {
  omniBySlugMap.set(item.slug, item);
  if (item.slug.endsWith('-calculator')) {
    omniBySlugMap.set(item.slug.slice(0, -'-calculator'.length), item);
  }
}

export function getOmniCalculator(slug: string): OmniCalculatorEntry | undefined {
  const clean = slug.toLowerCase().trim();
  const base = clean.endsWith('-calculator') ? clean.slice(0, -'-calculator'.length) : clean;
  return omniBySlugMap.get(base) || omniBySlugMap.get(clean);
}

export function getAllOmniCalculators(): OmniCalculatorEntry[] {
  return omniCalculators;
}

export function getOmniCalculatorsByCategory(category: string): OmniCalculatorEntry[] {
  return omniCalculators.filter((c) => c.category === category);
}

export function getOmniCategoryCount(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of omniCalculators) counts[c.category] = (counts[c.category] || 0) + 1;
  return counts;
}

export function toCalculatorMeta(omni: OmniCalculatorEntry): CalculatorMeta {
  return {
    slug: omni.slug,
    name: omni.name,
    shortName: omni.shortName,
    category: (omni.category as CalculatorMeta['category']) || 'math',
    description: omni.description,
    keywords: omni.keywords,
    icon: omni.icon,
  };
}

export function toCalcContent(omni: OmniCalculatorEntry): CalcContent {
  return { howToSteps: omni.howToSteps, formula: omni.formula, examples: omni.examples, faqs: omni.faqs };
}
