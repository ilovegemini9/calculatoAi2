export type KeywordClusterId = 'debt-credit' | 'mortgage-loan' | 'savings-investing' | 'health-fitness' | 'math-other';

export interface KeywordCluster {
  id: KeywordClusterId;
  label: string;
  description: string;
  keywords: string[];
  routes: string[];
}

/**
 * Curated search-intent language used in visible topic navigation, metadata,
 * and LLM summaries. These are not claims about search volume or rankings.
 */
export const KEYWORD_CLUSTERS: KeywordCluster[] = [
  {
    id: 'debt-credit',
    label: 'Debt & Credit Calculators',
    description: 'Plan payoff order, credit utilization, consolidation, and borrowing costs with transparent estimates.',
    keywords: [
      'debt payoff calculator',
      'credit card payoff calculator',
      'credit utilization calculator',
      'debt consolidation calculator',
      'debt to income ratio calculator',
      'debt snowball calculator',
      'debt avalanche calculator',
      'loan payoff calculator',
      'monthly debt payment calculator',
      'credit card interest calculator',
      'emergency fund calculator',
      'emergency savings target',
      'months of expenses calculator',
    ],
    routes: [
      'credit-utilization',
      'credit-cards-payoff',
      'debt-payoff',
      'debt-consolidation',
      'debt-to-income',
      'debt-snowball',
      'debt-avalanche',
      'emergency-fund',
    ],
  },
  {
    id: 'mortgage-loan',
    label: 'Mortgage & Loan Calculators',
    description: 'Compare home payments, amortization, affordability, refinancing, and personal-loan costs.',
    keywords: [
      'mortgage payment calculator',
      'home loan calculator',
      'mortgage amortization calculator',
      'house affordability calculator',
      'rent vs buy calculator',
      'mortgage payoff calculator',
      'refinance mortgage calculator',
      'personal loan payment calculator',
      'auto loan payment calculator',
      'student loan payment calculator',
      'loan to value calculator',
      'LTV ratio calculator',
      'combined loan to value calculator',
    ],
    routes: [
      'mortgage',
      'mortgage-amortization',
      'house-affordability',
      'rent-vs-buy',
      'refinance',
      'mortgage-payoff',
      'personal-loan',
      'student-loan',
      'loan-to-value',
    ],
  },
  {
    id: 'savings-investing',
    label: 'Savings & Investing Calculators',
    description: 'Project compound growth, retirement balances, inflation effects, and annualized investment performance with stated assumptions.',
    keywords: [
      'CAGR calculator',
      'compound annual growth rate calculator',
      'investment growth calculator',
      'compound interest calculator',
      'retirement savings calculator',
      '401k contribution calculator',
      'savings growth calculator',
      'inflation calculator',
    ],
    routes: ['cagr', 'compound-interest', 'investment', 'retirement', '401k', 'savings', 'inflation'],
  },
  {
    id: 'health-fitness',
    label: 'Health & Fitness Calculators',
    description: 'Explore educational estimates for body metrics, nutrition, exercise, and pregnancy timing with limitations stated.',
    keywords: [
      'bmi calculator',
      'calorie needs calculator',
      'bmr calculator',
      'tdee calculator',
      'body fat percentage calculator',
      'healthy weight calculator',
      'ideal weight calculator',
      'protein intake calculator',
      'macro calculator',
      'running pace calculator',
      'target heart rate calculator',
      'pregnancy due date calculator',
    ],
    routes: [
      'bmi',
      'calorie',
      'bmr',
      'tdee',
      'body-fat',
      'healthy-weight',
      'ideal-weight',
      'protein',
      'macro',
      'pace',
      'target-heart-rate',
      'due-date',
    ],
  },
  {
    id: 'math-other',
    label: 'Math & Everyday Utility Calculators',
    description: 'Solve common math, conversion, time, construction, science, and practical planning problems in the browser.',
    keywords: [
      'scientific calculator',
      'percentage calculator',
      'fraction calculator',
      'standard deviation calculator',
      'probability calculator',
      'scientific notation calculator',
      'unit conversion calculator',
      'date calculator',
      'time duration calculator',
      'fuel cost calculator',
      'concrete calculator',
      'ip subnet calculator',
      'molecular weight calculator',
      'random number generator',
      'seeded random number generator',
      'password generator',
      'password entropy calculator',
      'dice roller',
      'custom sided dice roller',
      'shoe size conversion',
      'foot length to shoe size',
      'day counter',
      'days between dates calculator',
      'business days calculator',
      'working days between dates',
      'days until calculator',
      'days since calculator',
      'countdown to date calculator',
      'bill split calculator',
      'split bill with tip',
      'restaurant bill calculator',
    ],
    routes: [
      'scientific',
      'percentage',
      'fraction',
      'standard-deviation',
      'probability',
      'scientific-notation',
      'conversion',
      'date',
      'time-duration',
      'fuel-cost',
      'concrete',
      'ip-subnet',
      'molecular-weight',
      'random-number',
      'password',
      'dice-roller',
      'shoe-size',
      'day-counter',
      'days-until',
      'bill-split',
    ],
  },
];

export const ALL_CLUSTER_KEYWORDS = Array.from(
  new Set(KEYWORD_CLUSTERS.flatMap((cluster) => cluster.keywords)),
);

const clusterRouteIndex = new Map(
  KEYWORD_CLUSTERS.flatMap((cluster) => cluster.routes.map((route) => [route, cluster.id] as const)),
);

export function getKeywordClusterId(slug: string): KeywordClusterId {
  const exact = clusterRouteIndex.get(slug);
  if (exact) return exact;
  if (/debt|credit|payoff|consolidation|utilization|income/.test(slug)) return 'debt-credit';
  if (/mortgage|loan|rent|refinance|amortization|heloc|equity/.test(slug)) return 'mortgage-loan';
  if (/cagr|compound-interest|investment|retirement|401k|savings|inflation|dividend|capital-gains/.test(slug)) return 'savings-investing';
  if (/bmi|calorie|bmr|tdee|weight|body|protein|macro|pace|pregnancy|heart|gfr|bac/.test(slug)) return 'health-fitness';
  return 'math-other';
}
