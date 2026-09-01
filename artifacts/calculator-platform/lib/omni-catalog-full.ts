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
  const slug = typeof item?.slug === 'string' ? item.slug.trim().toLowerCase() : '';
  if (!slug) continue;
  item.slug = slug;
  omniBySlugMap.set(slug, item);
  if (slug.endsWith('-calculator')) {
    omniBySlugMap.set(slug.slice(0, -'-calculator'.length), item);
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

function cleanText(value: string, fallback: string): string {
  const cleaned = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return cleaned || fallback;
}

function buildHelpfulDescription(item: OmniCalculatorEntry): string {
  const category = cleanText(item.category, 'calculator');
  const base = cleanText(item.description, `Calculate ${item.name.toLowerCase()} quickly and accurately online.`);
  const inputLabels = item.inputs
    .map((input) => input.label || input.name)
    .filter(Boolean)
    .slice(0, 4);
  const inputText = inputLabels.length ? ` Enter ${inputLabels.join(', ')} to get a clear result.` : '';
  const suffix = ` This free online ${category} calculator shows the result instantly and explains the calculation when formula details are available.`;
  const result = `${base}${inputText}${suffix}`;
  return result.length <= 320 ? result : `${base}${inputText}`.slice(0, 320).replace(/\s+\S*$/, '') + '.';
}

function buildHelpfulKeywords(item: OmniCalculatorEntry): string[] {
  const base = Array.isArray(item.keywords) ? item.keywords : [];
  const additions = [
    item.name,
    `${item.name} online`,
    `how to calculate ${item.shortName || item.name.replace(/\s*calculator\s*/i, '')}`,
    `${item.category} calculator`,
  ];
  return [...new Set([...base, ...additions].map((value) => String(value).trim()).filter(Boolean))].slice(0, 20);
}

export function toCalculatorMeta(omni: OmniCalculatorEntry): CalculatorMeta {
  return {
    slug: omni.slug,
    name: omni.name,
    shortName: omni.shortName,
    category: (omni.category as CalculatorMeta['category']) || 'math',
    description: buildHelpfulDescription(omni),
    keywords: buildHelpfulKeywords(omni),
    icon: omni.icon,
  };
}

export function toCalcContent(omni: OmniCalculatorEntry): CalcContent {
  const name = cleanText(omni.name, 'this calculator');
  const howToSteps = Array.isArray(omni.howToSteps) && omni.howToSteps.length
    ? omni.howToSteps
    : [
        `Enter the values requested by the ${name}.`,
        'Check the units and input values before calculating.',
        'Select Calculate to see the result and review the formula when provided.',
      ];
  const faqs = Array.isArray(omni.faqs) ? omni.faqs : [];
  const helpfulFaqs = faqs.length ? faqs : [
    { question: `What does the ${name} calculate?`, answer: buildHelpfulDescription(omni) },
    { question: `How do I use the ${name}?`, answer: howToSteps.join(' ') },
  ];
  const examples = Array.isArray(omni.examples) ? omni.examples : [];
  return {
    howToSteps,
    formula: omni.formula,
    examples,
    faqs: helpfulFaqs,
    useCases: [
      `Use the ${name} for quick estimates, planning, checking calculations, and comparing scenarios.`,
      `Review the inputs and units before relying on the result for real-world decisions.`,
    ],
    commonPitfalls: [
      'Using the wrong unit or mixing incompatible units can produce an incorrect result.',
      'Round only after the calculation when higher precision matters.',
    ],
  } as CalcContent;
}