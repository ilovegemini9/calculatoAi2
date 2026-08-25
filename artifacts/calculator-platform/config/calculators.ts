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
    slug: 'mortgage',
    name: 'Mortgage Calculator',
    shortName: 'Mortgage',
    category: 'financial',
    description:
      'Calculate your monthly mortgage payment including principal, interest, taxes, and insurance (PITI). See the full amortization schedule.',
    keywords: ['mortgage calculator', 'home loan calculator', 'piti calculator', 'house payment', 'monthly mortgage payment'],
    icon: '🏠',
  },
  {
    slug: 'mortgage-amortization',
    name: 'Mortgage Amortization Calculator',
    shortName: 'Amortization',
    category: 'financial',
    description:
      'View the complete amortization schedule for any mortgage. See exactly how each payment is split between principal and interest, year by year.',
    keywords: ['mortgage amortization calculator', 'amortization schedule', 'loan amortization', 'mortgage payoff', 'extra payment calculator'],
    icon: '📅',
  },
  {
    slug: 'house-affordability',
    name: 'House Affordability Calculator',
    shortName: 'Affordability',
    category: 'financial',
    description:
      'Find out how much house you can afford based on your income, debts, and down payment. Uses the 28/36 DTI rule used by mortgage lenders.',
    keywords: ['house affordability calculator', 'how much house can i afford', 'home affordability', 'mortgage affordability', 'dti calculator'],
    icon: '🏡',
  },
  {
    slug: 'rent',
    name: 'Rent Calculator',
    shortName: 'Rent',
    category: 'financial',
    description:
      'Calculate your true total cost of renting including utilities, insurance, parking, and fees. See 10-year projections with annual rent increases.',
    keywords: ['rent calculator', 'cost of renting', 'monthly rent calculator', 'rental cost calculator', 'rent affordability'],
    icon: '🏢',
  },
  {
    slug: 'rent-vs-buy',
    name: 'Rent vs. Buy Calculator',
    shortName: 'Rent vs. Buy',
    category: 'financial',
    description:
      'Compare the true financial cost of renting versus buying a home over time. Find your break-even year and net cost difference.',
    keywords: ['rent vs buy calculator', 'renting vs buying', 'rent or buy', 'buy vs rent', 'break even buying house'],
    icon: '⚖️',
  },
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
  {
    slug: 'rental-property',
    name: 'Rental Property Calculator',
    shortName: 'Rental Property',
    category: 'financial',
    description:
      'Analyze a rental property investment. Calculate monthly cash flow, cash-on-cash return, cap rate, and gross rent multiplier using real expenses.',
    keywords: ['rental property calculator', 'cash on cash return', 'cap rate calculator', 'real estate investment', 'rental income calculator', 'noi calculator'],
    icon: '🏘️',
  },
  {
    slug: 'real-estate',
    name: 'Real Estate Calculator',
    shortName: 'Real Estate ROI',
    category: 'financial',
    description:
      'Calculate real estate ROI, home appreciation, equity growth, and total profit on a property sale. Includes optional rental income analysis.',
    keywords: ['real estate calculator', 'real estate roi', 'home appreciation calculator', 'property investment calculator', 'real estate profit'],
    icon: '📈',
  },
  {
    slug: 'fha-loan',
    name: 'FHA Loan Calculator',
    shortName: 'FHA Loan',
    category: 'financial',
    description:
      'Calculate FHA loan payments including upfront and annual Mortgage Insurance Premium (MIP). See the true monthly cost for low-down-payment buyers.',
    keywords: ['fha loan calculator', 'fha mortgage calculator', 'fha mip calculator', 'fha payment', 'fha mortgage insurance', '3.5 percent down payment'],
    icon: '🏛️',
  },
  {
    slug: 'va-mortgage',
    name: 'VA Mortgage Calculator',
    shortName: 'VA Mortgage',
    category: 'financial',
    description:
      'Calculate VA loan payments and funding fee for veterans and active-duty service members. No PMI required — see how much you save vs a conventional loan.',
    keywords: ['va mortgage calculator', 'va loan calculator', 'va funding fee', 'veteran home loan', 'va home loan payment', 'military mortgage'],
    icon: '🎖️',
  },
  {
    slug: 'home-equity-loan',
    name: 'Home Equity Loan Calculator',
    shortName: 'Home Equity Loan',
    category: 'financial',
    description:
      'Calculate how much you can borrow against your home equity. See monthly payments, CLTV ratio, and total cost for a fixed-rate second mortgage.',
    keywords: ['home equity loan calculator', 'heloc calculator', 'second mortgage calculator', 'home equity calculator', 'cltv calculator', 'equity loan payment'],
    icon: '🏦',
  },
  {
    slug: 'heloc',
    name: 'HELOC Calculator',
    shortName: 'HELOC',
    category: 'financial',
    description:
      'Calculate your Home Equity Line of Credit limit, draw-period interest-only payments, and repayment-period P&I payments. See CLTV, max credit line, and total interest across both phases.',
    keywords: ['heloc calculator', 'home equity line of credit', 'heloc payment', 'draw period', 'heloc interest', 'equity line calculator'],
    icon: '🏗️',
  },
  {
    slug: 'down-payment',
    name: 'Down Payment Calculator',
    shortName: 'Down Payment',
    category: 'financial',
    description:
      'Calculate how much you need for a down payment and closing costs. See PMI costs, loan-type minimums (FHA, VA, conventional), and a savings timeline to reach your goal.',
    keywords: ['down payment calculator', 'how much down payment', 'closing costs calculator', 'pmi calculator', 'down payment savings', 'fha down payment'],
    icon: '💵',
  },
  {
    slug: 'refinance',
    name: 'Refinance Calculator',
    shortName: 'Refinance',
    category: 'financial',
    description:
      'Find out if refinancing your mortgage makes sense. Compare monthly savings, break-even point, and lifetime interest savings against closing costs.',
    keywords: ['refinance calculator', 'mortgage refinance calculator', 'break even refinance', 'should i refinance', 'refi calculator', 'refinancing savings'],
    icon: '🔄',
  },
  {
    slug: 'mortgage-payoff',
    name: 'Mortgage Payoff Calculator',
    shortName: 'Payoff',
    category: 'financial',
    description:
      'See how extra monthly payments or a lump sum can accelerate your mortgage payoff. Calculate interest saved and years cut from your loan term.',
    keywords: ['mortgage payoff calculator', 'extra mortgage payment calculator', 'pay off mortgage early', 'mortgage early payoff', 'lump sum mortgage payment', 'mortgage interest savings'],
    icon: '🏁',
  },
  {
    slug: 'mortgage-uk',
    name: 'Mortgage Calculator UK',
    shortName: 'UK Mortgage',
    category: 'financial',
    description:
      'UK mortgage calculator with Stamp Duty Land Tax (SDLT), LTV, repayment vs interest-only, and arrangement fees. First-time buyer and buy-to-let rates included.',
    keywords: ['mortgage calculator uk', 'uk mortgage calculator', 'stamp duty calculator', 'sdlt calculator', 'uk home loan', 'first time buyer calculator uk', 'buy to let mortgage calculator'],
    icon: '🇬🇧',
  },
  {
    slug: 'canadian-mortgage',
    name: 'Canadian Mortgage Calculator',
    shortName: 'Canadian Mortgage',
    category: 'financial',
    description:
      'Canadian mortgage calculator with semi-annual compounding (Interest Act), CMHC mortgage insurance, monthly and accelerated bi-weekly payment options.',
    keywords: ['canadian mortgage calculator', 'canada mortgage calculator', 'cmhc calculator', 'canadian home loan', 'semi-annual compounding mortgage', 'canadian amortization', 'bi-weekly mortgage canada'],
    icon: '🇨🇦',
  },
  {
    slug: 'personal-loan',
    name: 'Personal Loan Calculator',
    shortName: 'Personal Loan',
    category: 'financial',
    description:
      'Calculate monthly payments, total interest, and true APR for any personal loan. Supports origination fees to show the real cost of borrowing.',
    keywords: ['personal loan calculator', 'personal loan payment calculator', 'loan apr calculator', 'origination fee calculator', 'unsecured loan calculator', 'personal loan interest'],
    icon: '💳',
  },
  {
    slug: 'auto-loan',
    name: 'Auto Loan Calculator',
    shortName: 'Auto Loan',
    category: 'financial',
    description:
      'Calculate monthly car loan payments including sales tax, trade-in value, dealer fees, and down payment. See the full amortization schedule.',
    keywords: ['auto loan calculator', 'car loan calculator', 'car payment calculator', 'vehicle loan calculator', 'auto loan payment', 'car financing calculator'],
    icon: '🚗',
  },
  {
    slug: 'auto-lease',
    name: 'Auto Lease Calculator',
    shortName: 'Auto Lease',
    category: 'financial',
    description:
      'Calculate monthly car lease payments using money factor, residual value, and cap cost. Understand depreciation, finance charges, and total lease cost.',
    keywords: ['auto lease calculator', 'car lease calculator', 'lease payment calculator', 'money factor calculator', 'residual value calculator', 'cap cost calculator', 'lease vs buy calculator'],
    icon: '🔑',
  },
  {
    slug: 'boat-loan',
    name: 'Boat Loan Calculator',
    shortName: 'Boat Loan',
    category: 'financial',
    description:
      'Estimate boat loan payments, total interest, financed amount, taxes, fees, and yearly amortization from your purchase price and loan terms.',
    keywords: ['boat loan calculator', 'boat payment calculator', 'marine loan calculator', 'boat financing calculator', 'boat loan payment', 'boat interest calculator'],
    icon: '⛵',
  },
  {
    slug: 'payment',
    name: 'Payment Calculator',
    shortName: 'Payment',
    category: 'financial',
    description:
      'Calculate a fixed-rate loan payment, total interest, total cost, and amortization schedule from the amount, rate, term, and fees.',
    keywords: ['payment calculator', 'loan payment calculator', 'monthly payment calculator', 'fixed payment calculator', 'finance payment calculator'],
    icon: '🧾',
  },
  {
    slug: 'repayment',
    name: 'Repayment Calculator',
    shortName: 'Repayment',
    category: 'financial',
    description:
      'Find how many payments you need to clear a balance from your interest rate and planned monthly repayment, with a warning when payment is too low.',
    keywords: ['repayment calculator', 'debt repayment calculator', 'loan repayment calculator', 'payoff calculator', 'monthly repayment calculator'],
    icon: '🔁',
  },
  {
    slug: 'student-loan',
    name: 'Student Loan Calculator',
    shortName: 'Student Loan',
    category: 'financial',
    description:
      'Estimate student loan payments, origination fees, total interest, payoff time, and savings from an extra monthly payment.',
    keywords: ['student loan calculator', 'student loan payment calculator', 'college loan calculator', 'student debt calculator', 'student loan interest calculator'],
    icon: '🎓',
  },
  {
    slug: 'college-cost',
    name: 'College Cost Calculator',
    shortName: 'College Cost',
    category: 'financial',
    description:
      'Project future annual and four-year college costs with inflation, then compare them with current savings and growing annual contributions.',
    keywords: ['college cost calculator', 'college tuition calculator', 'future college cost calculator', 'education savings calculator', 'college savings calculator'],
    icon: '🏫',
  },
  {
    slug: 'credit-card',
    name: 'Credit Card Calculator',
    shortName: 'Credit Card',
    category: 'financial',
    description: 'Estimate a credit-card minimum payment, payoff time, total payments, and interest from balance and APR.',
    keywords: ['credit card calculator', 'credit card payment calculator', 'credit card interest calculator', 'minimum payment calculator', 'credit card payoff time'],
    icon: '💳',
  },
  {
    slug: 'credit-cards-payoff',
    name: 'Credit Cards Payoff Calculator',
    shortName: 'Credit Cards Payoff',
    category: 'financial',
    description: 'Combine three card balances and payment assumptions to estimate total interest and the longest payoff period.',
    keywords: ['credit cards payoff calculator', 'multiple credit card payoff calculator', 'credit card debt payoff', 'pay off multiple credit cards'],
    icon: '💳',
  },
  {
    slug: 'debt-payoff',
    name: 'Debt Payoff Calculator',
    shortName: 'Debt Payoff',
    category: 'financial',
    description: 'Estimate debt payoff months, total interest, and total payments from a balance, APR, and planned monthly payment.',
    keywords: ['debt payoff calculator', 'debt payment calculator', 'payoff time calculator', 'debt interest calculator'],
    icon: '📉',
  },
  {
    slug: 'debt-consolidation',
    name: 'Debt Consolidation Calculator',
    shortName: 'Debt Consolidation',
    category: 'financial',
    description: 'Compare an existing debt payment and interest with a new fixed-rate consolidation payment, fees, and term.',
    keywords: ['debt consolidation calculator', 'consolidation loan calculator', 'debt refinance calculator', 'debt consolidation savings'],
    icon: '🔗',
  },
  {
    slug: 'debt-to-income',
    name: 'Debt-to-Income Ratio Calculator',
    shortName: 'Debt-to-Income Ratio',
    category: 'financial',
    description: 'Calculate current and proposed debt-to-income ratios from gross monthly income, debts, housing, and new debt.',
    keywords: ['debt to income ratio calculator', 'DTI calculator', 'debt-to-income calculator', 'monthly debt ratio'],
    icon: '⚖️',
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
