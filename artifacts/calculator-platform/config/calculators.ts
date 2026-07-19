export interface CalculatorMeta {
  slug: string;
  name: string;
  shortName: string;
  category: 'financial' | 'fitness' | 'math' | 'lifestyle';
  description: string;
  keywords: string[];
  icon: string; // emoji
}

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: 'age',
    name: 'Age Calculator',
    shortName: 'Age',
    category: 'lifestyle',
    description:
      'Calculate your exact age in years, months, days, hours, and minutes. Find out how many days until your next birthday.',
    keywords: ['age calculator', 'birthday calculator', 'how old am i', 'age in days'],
    icon: '🎂',
  },
  {
    slug: 'bmi',
    name: 'BMI Calculator',
    shortName: 'BMI',
    category: 'fitness',
    description:
      'Calculate your Body Mass Index (BMI) using metric or imperial units. Get your weight category and healthy weight range.',
    keywords: ['bmi calculator', 'body mass index', 'healthy weight', 'overweight calculator'],
    icon: '⚖️',
  },
  {
    slug: 'calorie',
    name: 'Calorie Calculator',
    shortName: 'Calorie',
    category: 'fitness',
    description:
      'Calculate your daily calorie needs using the Mifflin-St Jeor formula. Find your BMR and TDEE for weight loss or gain.',
    keywords: ['calorie calculator', 'tdee calculator', 'bmr calculator', 'daily calories'],
    icon: '🔥',
  },
  {
    slug: 'gpa',
    name: 'GPA Calculator',
    shortName: 'GPA',
    category: 'math',
    description:
      'Calculate your weighted and unweighted GPA. Supports regular, honors, and AP/IB courses on a 4.0 scale.',
    keywords: ['gpa calculator', 'grade point average', 'weighted gpa', 'ap gpa calculator'],
    icon: '🎓',
  },
  {
    slug: 'loan',
    name: 'Loan Calculator',
    shortName: 'Loan',
    category: 'financial',
    description:
      'Calculate monthly loan payments, total interest, and view a full amortization schedule for any loan amount.',
    keywords: ['loan calculator', 'loan payment calculator', 'amortization calculator', 'personal loan'],
    icon: '💰',
  },
  {
    slug: 'mortgage',
    name: 'Mortgage Calculator',
    shortName: 'Mortgage',
    category: 'financial',
    description:
      'Calculate your monthly mortgage payment including principal, interest, taxes, and insurance (PITI).',
    keywords: ['mortgage calculator', 'home loan calculator', 'piti calculator', 'house payment'],
    icon: '🏠',
  },
  {
    slug: 'percentage',
    name: 'Percentage Calculator',
    shortName: 'Percentage',
    category: 'math',
    description:
      'Calculate percentages instantly. Find what % of a number is, what percent one number is of another, or % change.',
    keywords: ['percentage calculator', 'percent calculator', 'percent change calculator', 'percentage increase'],
    icon: '📊',
  },
  {
    slug: 'tip',
    name: 'Tip Calculator',
    shortName: 'Tip',
    category: 'lifestyle',
    description:
      'Calculate the tip amount and split the bill among multiple people. Works for any tip percentage.',
    keywords: ['tip calculator', 'gratuity calculator', 'bill split calculator', 'restaurant tip'],
    icon: '🍽️',
  },
];

export const CALCULATOR_BY_SLUG = Object.fromEntries(CALCULATORS.map((c) => [c.slug, c]));

export const CATEGORY_LABELS: Record<string, string> = {
  financial: 'Financial',
  fitness: 'Fitness & Health',
  math: 'Math',
  lifestyle: 'Lifestyle',
};

export const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  financial: { text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-900/40' },
  fitness: { text: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-900/40' },
  math: { text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-900/40' },
  lifestyle: { text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-900/40' },
};
