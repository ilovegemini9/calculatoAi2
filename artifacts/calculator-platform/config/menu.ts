import type { CalculatorMeta } from './calculators';

export interface MenuGroup {
  id: string;
  label: string;
  description: string;
  categories?: CalculatorMeta['category'][];
  slugIncludes?: string[];
}

/**
 * Editorial menu groups are a discovery taxonomy, not a replacement for the
 * calculator's primary category. A calculator can appear in more than one
 * intent group when that creates a useful path to the same canonical route.
 */
export const REFERENCE_MENU_GROUPS: MenuGroup[] = [
  { id: 'finance', label: 'Finance', description: 'Payments, interest, debt, savings, investing, tax, and retirement planning.', categories: ['financial'] },
  { id: 'health', label: 'Health', description: 'Educational body, nutrition, exercise, and timing estimates with stated limits.', categories: ['fitness'] },
  { id: 'business', label: 'Business', description: 'Business math, pricing, returns, margins, valuation, and cash-flow planning.', slugIncludes: ['business', 'roi', 'margin', 'discount', 'commission', 'vat', 'irr', 'depreciation', 'payback', 'present-value', 'future-value', 'gdp', 'budget'] },
  { id: 'math', label: 'Math', description: 'Algebra, geometry, statistics, probability, fractions, and number tools.', categories: ['math'] },
  { id: 'utilities', label: 'Utilities', description: 'Dates, time, conversions, generators, encoding, and everyday reference tools.', slugIncludes: ['date', 'time', 'hours', 'age', 'conversion', 'random-number', 'password', 'dice-roller', 'shoe-size', 'day-of-the-week', 'bandwidth', 'base64', 'url-encode', 'ip-subnet', 'height'] },
  { id: 'eco', label: 'Eco', description: 'Fuel, mileage, energy-style estimates, and practical resource calculations.', slugIncludes: ['fuel', 'gas-mileage', 'mileage', 'energy', 'carbon', 'solar'] },
  { id: 'tech', label: 'Tech', description: 'Network, data representation, binary, hexadecimal, and technical conversions.', slugIncludes: ['bandwidth', 'base64', 'url-encode', 'ip-subnet', 'binary', 'hex', 'scientific-notation', 'molecular-weight'] },
  { id: 'property', label: 'Property', description: 'Mortgages, rent, home equity, affordability, construction, and property comparisons.', slugIncludes: ['mortgage', 'house', 'rent', 'real-estate', 'rental', 'heloc', 'equity', 'down-payment', 'refinance', 'roofing', 'tile', 'mulch', 'gravel', 'concrete'] },
  { id: 'marketing', label: 'Marketing', description: 'Percent changes, discounts, commissions, margins, and campaign-oriented estimates.', slugIncludes: ['percentage', 'percent-off', 'discount', 'commission', 'margin', 'conversion', 'roi', 'average-return'] },
  { id: 'hobbies', label: 'Hobbies', description: 'Games, golf, sizing, fitness challenges, and light entertainment utilities.', slugIncludes: ['love', 'golf', 'tire-size', 'bra-size', 'dice-roller', 'shoe-size', 'weight-watcher'] },
];

export function getMenuCalculators(group: MenuGroup, calculators: CalculatorMeta[], limit?: number) {
  const matched = calculators.filter((calculator) => {
    const categoryMatch = group.categories?.includes(calculator.category) ?? false;
    const slugMatch = group.slugIncludes?.some((fragment) => calculator.slug.includes(fragment)) ?? false;
    return categoryMatch || slugMatch;
  });
  return limit ? matched.slice(0, limit) : matched;
}
