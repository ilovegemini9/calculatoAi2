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

type RawOmniEntry = Partial<OmniCalculatorEntry> & {
  id?: string;
  title?: string;
  url?: string;
};

type RawOmniData = { calculators?: RawOmniEntry[] };

const CATEGORY_ALIASES: Record<string, string> = {
  'health & fitness': 'health',
  'health and fitness': 'health',
  health_fitness: 'health',
  'everyday life': 'everyday-life',
  everyday_life: 'everyday-life',
  'other calculators': 'other',
};

function normalizeCategory(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return CATEGORY_ALIASES[raw] || raw.replace(/\s+/g, '-');
}

function normalizeSlug(value: unknown): string {
  if (typeof value !== 'string') return '';
  const raw = value.trim().toLowerCase();
  if (!raw || raw === 'undefined' || raw === 'null') return '';
  const fromUrl = raw.match(/\/([^/?#]+)\/?(?:\?.*)?$/)?.[1] || raw;
  const slug = fromUrl.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.endsWith('-calculator') ? slug.slice(0, -'-calculator'.length) : slug;
}

function fallbackEntry(raw: RawOmniEntry): OmniCalculatorEntry {
  const slug = normalizeSlug(raw.slug || raw.id || raw.url || raw.title);
  const name = typeof raw.name === 'string' && raw.name.trim()
    ? raw.name.trim()
    : (typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : slug.replace(/-/g, ' '));
  const category = normalizeCategory(raw.category) || 'other';
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  const shortName = typeof raw.shortName === 'string' && raw.shortName.trim()
    ? raw.shortName.trim()
    : name.replace(/\s*calculator\s*/i, '').trim();
  return {
    slug,
    name,
    shortName,
    category,
    icon: typeof raw.icon === 'string' && raw.icon ? raw.icon : '🧮',
    description,
    keywords: Array.isArray(raw.keywords) ? raw.keywords.filter((v): v is string => typeof v === 'string') : [],
    inputs: Array.isArray(raw.inputs) ? raw.inputs as OmniCalculatorEntry['inputs'] : [],
    outputs: Array.isArray(raw.outputs) ? raw.outputs as OmniCalculatorEntry['outputs'] : [{ name: 'result', label: 'Result', highlight: true }],
    formula: raw.formula && typeof raw.formula === 'object'
      ? raw.formula as OmniCalculatorEntry['formula']
      : { expression: 'See calculator inputs', variables: [] },
    howToSteps: Array.isArray(raw.howToSteps) ? raw.howToSteps.filter((v): v is string => typeof v === 'string') : [],
    faqs: Array.isArray(raw.faqs) ? raw.faqs as OmniCalculatorEntry['faqs'] : [],
    examples: Array.isArray(raw.examples) ? raw.examples as OmniCalculatorEntry['examples'] : [],
  };
}

const rawOmniList = ((omniData as RawOmniData)?.calculators || []);
const normalizedOmniList = rawOmniList.map(fallbackEntry).filter((item) => item.slug);

const omniCalculators: OmniCalculatorEntry[] = normalizedOmniList.length > 0 ? normalizedOmniList : CALCULATORS.map((calculator: CalculatorMeta) => ({
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
  const slug = normalizeSlug(item.slug);
  if (!slug) continue;
  item.slug = slug;
  item.category = normalizeCategory(item.category) || 'other';
  omniBySlugMap.set(slug, item);
}

export function getOmniCalculator(slug: string): OmniCalculatorEntry | undefined {
  const clean = normalizeSlug(slug);
  return omniBySlugMap.get(clean);
}

export function getAllOmniCalculators(): OmniCalculatorEntry[] {
  return omniCalculators;
}

export function getOmniCalculatorsByCategory(category: string): OmniCalculatorEntry[] {
  const normalized = normalizeCategory(category);
  return omniCalculators.filter((c) => normalizeCategory(c.category) === normalized);
}

export function getOmniCategoryCount(): Record<string, number> {
  const counts: Record<string, number> = {};
  const seen = new Set<string>();
  for (const c of omniCalculators) {
    const slug = normalizeSlug(c.slug);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const category = normalizeCategory(c.category) || 'other';
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

function cleanText(value: string, fallback: string): string {
  const cleaned = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return cleaned || fallback;
}

function buildHelpfulDescription(item: OmniCalculatorEntry): string {
  const category = cleanText(item.category, 'calculator');
  const base = cleanText(item.description, `Calculate ${item.name.toLowerCase()} quickly and accurately online.`);
  const inputLabels = item.inputs.map((input) => input.label || input.name).filter(Boolean).slice(0, 4);
  const inputText = inputLabels.length ? ` Enter ${inputLabels.join(', ')} to get a clear result.` : '';
  const suffix = ` This free online ${category} calculator shows the result instantly and explains the calculation when formula details are available.`;
  const result = `${base}${inputText}${suffix}`;
  return result.length <= 320 ? result : `${base}${inputText}`.slice(0, 320).replace(/\s+\S*$/, '') + '.';
}

function buildHelpfulKeywords(item: OmniCalculatorEntry): string[] {
  const additions = [
    item.name,
    `${item.name} online`,
    `how to calculate ${item.shortName || item.name.replace(/\s*calculator\s*/i, '')}`,
    `${item.category} calculator`,
  ];
  return [...new Set([...item.keywords, ...additions].map((value) => String(value).trim()).filter(Boolean))].slice(0, 20);
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
  const howToSteps = omni.howToSteps.length ? omni.howToSteps : [
    `Enter the values requested by the ${name}.`,
    'Check the units and input values before calculating.',
    'Select Calculate to see the result and review the formula when provided.',
  ];
  const helpfulFaqs = omni.faqs.length ? omni.faqs : [
    { question: `What does the ${name} calculate?`, answer: buildHelpfulDescription(omni) },
    { question: `How do I use the ${name}?`, answer: howToSteps.join(' ') },
  ];
  return {
    howToSteps,
    formula: omni.formula,
    examples: omni.examples,
    faqs: helpfulFaqs,
    useCases: [
      `Use the ${name} for quick estimates, planning, checking calculations, and comparing scenarios.`,
      'Review the inputs and units before relying on the result for real-world decisions.',
    ],
    commonPitfalls: [
      'Using the wrong unit or mixing incompatible units can produce an incorrect result.',
      'Round only after the calculation when higher precision matters.',
    ],
  } as CalcContent;
}
