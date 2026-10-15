/**
 * Original calculator coverage catalog.
 *
 * This file intentionally contains calculator concepts and metadata only.
 * It does not copy Omni Calculator code, page copy, branding, or proprietary data.
 * Implementations must be added to the trusted calculator registry before use.
 */
export type CatalogCategory =
  | 'math' | 'finance' | 'health' | 'conversion' | 'time-date'
  | 'construction' | 'physics' | 'statistics' | 'chemistry'
  | 'biology' | 'sports' | 'food' | 'everyday' | 'ecology' | 'other';

export interface CatalogEntry {
  slug: string;
  name: string;
  category: CatalogCategory;
  priority: 'core' | 'growth' | 'long-tail';
  keywords: string[];
}

const e = (
  slug: string,
  name: string,
  category: CatalogCategory,
  priority: CatalogEntry['priority'] = 'growth',
  keywords: string[] = [],
): CatalogEntry => ({ slug, name, category, priority, keywords: [name.toLowerCase(), ...keywords] });

export const OMNI_INSPIRED_CATALOG: CatalogEntry[] = [
  // Math / arithmetic / algebra
  e('percentage', 'Percentage Calculator', 'math', 'core', ['percent calculator']),
  e('percentage-increase', 'Percentage Increase Calculator', 'math', 'core'),
  e('percentage-decrease', 'Percentage Decrease Calculator', 'math', 'growth'),
  e('fraction', 'Fraction Calculator', 'math', 'core'),
  e('ratio', 'Ratio Calculator', 'math', 'core'),
  e('proportion', 'Proportion Calculator', 'math'),
  e('decimal-to-fraction', 'Decimal to Fraction Calculator', 'math'),
  e('fraction-to-decimal', 'Fraction to Decimal Calculator', 'math'),
  e('scientific', 'Scientific Calculator', 'math', 'core'),
  e('scientific-notation', 'Scientific Notation Calculator', 'math'),
  e('exponent', 'Exponent Calculator', 'math', 'core'),
  e('square-root', 'Square Root Calculator', 'math', 'core'),
  e('cube-root', 'Cube Root Calculator', 'math'),
  e('logarithm', 'Logarithm Calculator', 'math', 'growth', ['log calculator']),
  e('natural-log', 'Natural Log Calculator', 'math'),
  e('gcd', 'GCD Calculator', 'math'),
  e('lcm', 'LCM Calculator', 'math'),
  e('prime-number', 'Prime Number Calculator', 'math'),
  e('factorial', 'Factorial Calculator', 'math'),
  e('permutation', 'Permutation Calculator', 'math'),
  e('combination', 'Combination Calculator', 'math'),
  e('quadratic-formula', 'Quadratic Formula Calculator', 'math'),
  e('slope', 'Slope Calculator', 'math', 'core'),
  e('distance', 'Distance Calculator', 'math'),
  e('midpoint', 'Midpoint Calculator', 'math'),
  e('pythagorean', 'Pythagorean Theorem Calculator', 'math', 'core'),
  e('circle', 'Circle Calculator', 'math'),
  e('triangle', 'Triangle Calculator', 'math'),
  e('rectangle', 'Rectangle Calculator', 'math'),
  e('trapezoid', 'Trapezoid Calculator', 'math'),
  e('polygon', 'Polygon Calculator', 'math'),
  e('area', 'Area Calculator', 'math'),
  e('volume', 'Volume Calculator', 'math'),
  e('surface-area', 'Surface Area Calculator', 'math'),
  e('matrix', 'Matrix Calculator', 'math'),
  e('mean-median-mode', 'Mean Median Mode Calculator', 'statistics'),

  // Finance
  e('mortgage', 'Mortgage Calculator', 'finance', 'core'),
  e('mortgage-payoff', 'Mortgage Payoff Calculator', 'finance', 'core'),
  e('loan', 'Loan Calculator', 'finance', 'core'),
  e('auto-loan', 'Auto Loan Calculator', 'finance', 'growth'),
  e('personal-loan', 'Personal Loan Calculator', 'finance'),
  e('interest', 'Interest Calculator', 'finance', 'core'),
  e('compound-interest', 'Compound Interest Calculator', 'finance', 'core'),
  e('simple-interest', 'Simple Interest Calculator', 'finance'),
  e('investment', 'Investment Calculator', 'finance', 'core'),
  e('retirement', 'Retirement Calculator', 'finance', 'core'),
  e('401k', '401(k) Calculator', 'finance', 'growth'),
  e('savings', 'Savings Calculator', 'finance', 'core'),
  e('inflation', 'Inflation Calculator', 'finance', 'growth'),
  e('sales-tax', 'Sales Tax Calculator', 'finance', 'core'),
  e('tip', 'Tip Calculator', 'finance', 'core'),
  e('discount', 'Discount Calculator', 'finance', 'core'),
  e('markup', 'Markup Calculator', 'finance'),
  e('margin', 'Profit Margin Calculator', 'finance'),
  e('salary-to-hourly', 'Salary to Hourly Calculator', 'finance', 'growth'),
  e('hourly-to-salary', 'Hourly to Salary Calculator', 'finance'),
  e('take-home-pay', 'Take-Home Pay Calculator', 'finance', 'growth'),
  e('break-even', 'Break-Even Calculator', 'finance'),
  e('roi', 'ROI Calculator', 'finance', 'growth'),
  e('apr', 'APR Calculator', 'finance'),
  e('net-worth', 'Net Worth Calculator', 'finance'),
  e('currency', 'Currency Converter', 'conversion', 'core'),

  // Health / fitness (must receive appropriate review/disclaimers)
  e('bmi', 'BMI Calculator', 'health', 'core'),
  e('bmr', 'BMR Calculator', 'health', 'core'),
  e('calorie', 'Calorie Calculator', 'health', 'core'),
  e('body-fat', 'Body Fat Calculator', 'health', 'growth'),
  e('ideal-weight', 'Ideal Weight Calculator', 'health'),
  e('macro', 'Macro Calculator', 'health'),
  e('protein', 'Protein Calculator', 'health'),
  e('water-intake', 'Water Intake Calculator', 'health'),
  e('pace', 'Pace Calculator', 'sports', 'core'),
  e('running-calories', 'Running Calorie Calculator', 'sports'),
  e('one-rep-max', 'One Rep Max Calculator', 'sports'),
  e('vo2-max', 'VO2 Max Calculator', 'sports'),
  e('heart-rate', 'Target Heart Rate Calculator', 'health'),
  e('pregnancy-due-date', 'Pregnancy Due Date Calculator', 'health', 'growth'),
  e('age', 'Age Calculator', 'time-date', 'core'),

  // Time / date
  e('date', 'Date Calculator', 'time-date', 'core'),
  e('time', 'Time Calculator', 'time-date', 'core'),
  e('time-difference', 'Time Difference Calculator', 'time-date', 'core'),
  e('duration', 'Time Duration Calculator', 'time-date'),
  e('days-between-dates', 'Days Between Dates Calculator', 'time-date', 'core'),
  e('business-days', 'Business Days Calculator', 'time-date', 'growth'),
  e('day-of-year', 'Day of the Year Calculator', 'time-date'),
  e('week-number', 'Week Number Calculator', 'time-date'),
  e('leap-year', 'Leap Year Calculator', 'time-date'),
  e('birthday', 'Birthday Calculator', 'time-date', 'growth'),
  e('countdown', 'Countdown Calculator', 'time-date'),
  e('time-zone', 'Time Zone Converter', 'time-date', 'growth'),

  // Conversion
  e('length-converter', 'Length Converter', 'conversion', 'core'),
  e('weight-converter', 'Weight Converter', 'conversion', 'core'),
  e('temperature-converter', 'Temperature Converter', 'conversion', 'core'),
  e('area-converter', 'Area Converter', 'conversion', 'core'),
  e('volume-converter', 'Volume Converter', 'conversion', 'core'),
  e('speed-converter', 'Speed Converter', 'conversion'),
  e('pressure-converter', 'Pressure Converter', 'conversion'),
  e('energy-converter', 'Energy Converter', 'conversion'),
  e('power-converter', 'Power Converter', 'conversion'),
  e('data-converter', 'Data Storage Converter', 'conversion'),
  e('frequency-converter', 'Frequency Converter', 'conversion'),
  e('angle-converter', 'Angle Converter', 'conversion'),

  // Construction
  e('square-footage', 'Square Footage Calculator', 'construction', 'core'),
  e('concrete', 'Concrete Calculator', 'construction', 'growth'),
  e('roofing', 'Roofing Calculator', 'construction'),
  e('paint', 'Paint Calculator', 'construction'),
  e('flooring', 'Flooring Calculator', 'construction'),
  e('gravel', 'Gravel Calculator', 'construction'),
  e('mulch', 'Mulch Calculator', 'construction'),
  e('tile', 'Tile Calculator', 'construction'),
  e('stairs', 'Stair Calculator', 'construction'),
  e('board-foot', 'Board Foot Calculator', 'construction'),

  // Physics
  e('force', 'Force Calculator', 'physics'),
  e('velocity', 'Velocity Calculator', 'physics'),
  e('acceleration', 'Acceleration Calculator', 'physics'),
  e('momentum', 'Momentum Calculator', 'physics'),
  e('kinetic-energy', 'Kinetic Energy Calculator', 'physics'),
  e('potential-energy', 'Potential Energy Calculator', 'physics'),
  e('work', 'Work Calculator', 'physics'),
  e('power-physics', 'Physics Power Calculator', 'physics'),
  e('density', 'Density Calculator', 'physics'),
  e('pressure', 'Pressure Calculator', 'physics'),
  e('ohms-law', "Ohm's Law Calculator", 'physics', 'growth'),
  e('resistor', 'Resistor Calculator', 'physics'),
  e('wavelength', 'Wavelength Calculator', 'physics'),
  e('frequency', 'Frequency Calculator', 'physics'),

  // Statistics
  e('standard-deviation', 'Standard Deviation Calculator', 'statistics', 'core'),
  e('variance', 'Variance Calculator', 'statistics'),
  e('z-score', 'Z-Score Calculator', 'statistics'),
  e('confidence-interval', 'Confidence Interval Calculator', 'statistics', 'core'),
  e('p-value', 'P-Value Calculator', 'statistics', 'core'),
  e('sample-size', 'Sample Size Calculator', 'statistics'),
  e('probability', 'Probability Calculator', 'statistics', 'core'),
  e('binomial', 'Binomial Probability Calculator', 'statistics'),
  e('normal-distribution', 'Normal Distribution Calculator', 'statistics'),
  e('correlation', 'Correlation Coefficient Calculator', 'statistics'),
  e('regression', 'Linear Regression Calculator', 'statistics'),
  e('percentile', 'Percentile Calculator', 'statistics'),

  // Chemistry
  e('molarity', 'Molarity Calculator', 'chemistry'),
  e('moles', 'Moles Calculator', 'chemistry'),
  e('molar-mass', 'Molar Mass Calculator', 'chemistry'),
  e('ph', 'pH Calculator', 'chemistry'),
  e('dilution', 'Dilution Calculator', 'chemistry'),
  e('half-life', 'Half-Life Calculator', 'chemistry'),
  e('ideal-gas-law', 'Ideal Gas Law Calculator', 'chemistry'),
  e('stoichiometry', 'Stoichiometry Calculator', 'chemistry'),

  // Biology / ecology
  e('population-growth', 'Population Growth Calculator', 'biology'),
  e('hardy-weinberg', 'Hardy-Weinberg Calculator', 'biology'),
  e('biodiversity', 'Biodiversity Calculator', 'ecology'),
  e('carbon-footprint', 'Carbon Footprint Calculator', 'ecology', 'growth'),
  e('water-footprint', 'Water Footprint Calculator', 'ecology'),

  // Food / everyday
  e('recipe-scaling', 'Recipe Scaling Calculator', 'food', 'growth'),
  e('cooking-conversion', 'Cooking Conversion Calculator', 'food'),
  e('tip-split', 'Tip Split Calculator', 'everyday', 'growth'),
  e('split-bill', 'Split Bill Calculator', 'everyday', 'growth'),
  e('fuel-cost', 'Fuel Cost Calculator', 'everyday', 'growth'),
  e('gas-mileage', 'Gas Mileage Calculator', 'everyday'),
  e('commute-cost', 'Commute Cost Calculator', 'everyday'),
  e('discount-price', 'Discount Price Calculator', 'everyday'),
  e('age-difference', 'Age Difference Calculator', 'time-date', 'growth'),
];

export const CATALOG_BY_SLUG = Object.fromEntries(
  OMNI_INSPIRED_CATALOG.map((entry) => [entry.slug, entry]),
) as Record<string, CatalogEntry>;

export const CATALOG_STATS = OMNI_INSPIRED_CATALOG.reduce<Record<string, number>>((acc, entry) => {
  acc[entry.category] = (acc[entry.category] ?? 0) + 1;
  return acc;
}, {});
