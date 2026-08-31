import type { CalculatorSpec } from './calculator-batch-01';

export const CALCULATOR_BATCH_06: CalculatorSpec[] = [
  { slug: 'absolute-value-equation', name: 'Absolute Value Equation Calculator', category: 'math', inputs: ['a','b','c'], outputs: ['solutions'], formula: '|a·x+b|=c' },
  { slug: 'unit-rate', name: 'Unit Rate Calculator', category: 'math', inputs: ['quantity','units'], outputs: ['unitRate'], formula: 'quantity / units' },
  { slug: 'doubling-time', name: 'Doubling Time Calculator', category: 'math', inputs: ['growthRate'], outputs: ['doublingTime'], formula: 'ln(2) / ln(1+r)' },
  { slug: 'percentage-difference', name: 'Percentage Difference Calculator', category: 'math', inputs: ['value1','value2'], outputs: ['percentageDifference'], formula: '|a-b| / ((a+b)/2) × 100' },
  { slug: 'percentage-point', name: 'Percentage Point Calculator', category: 'math', inputs: ['oldPercent','newPercent'], outputs: ['percentagePoints'], formula: 'newPercent - oldPercent' },
  { slug: 'break-even', name: 'Break-even Calculator', category: 'finance', inputs: ['fixedCosts','pricePerUnit','variableCostPerUnit'], outputs: ['breakEvenUnits'], formula: 'fixedCosts / (pricePerUnit - variableCostPerUnit)' },
  { slug: 'contribution-margin', name: 'Contribution Margin Calculator', category: 'finance', inputs: ['sales','variableCosts'], outputs: ['contributionMargin'], formula: 'sales - variableCosts' },
  { slug: 'burn-rate', name: 'Burn Rate Calculator', category: 'finance', inputs: ['startingCash','endingCash','months'], outputs: ['monthlyBurnRate'], formula: '(startingCash-endingCash)/months' },
  { slug: 'roi', name: 'ROI Calculator', category: 'finance', inputs: ['gain','cost'], outputs: ['roiPercent'], formula: '(gain-cost)/cost × 100' },
  { slug: 'salary-to-hourly', name: 'Salary to Hourly Calculator', category: 'finance', inputs: ['annualSalary','hoursPerWeek','weeksPerYear'], outputs: ['hourlyRate'], formula: 'annualSalary/(hoursPerWeek×weeksPerYear)' },
  { slug: 'free-fall', name: 'Free Fall Calculator', category: 'physics', inputs: ['height','gravity'], outputs: ['time','impactVelocity'], formula: 't=√(2h/g); v=√(2gh)' },
  { slug: 'kinetic-energy', name: 'Kinetic Energy Calculator', category: 'physics', inputs: ['mass','velocity'], outputs: ['energy'], formula: 'E=mv²/2' },
  { slug: 'potential-energy', name: 'Potential Energy Calculator', category: 'physics', inputs: ['mass','gravity','height'], outputs: ['energy'], formula: 'E=mgh' },
  { slug: 'newtons-second-law', name: "Newton's Second Law Calculator", category: 'physics', inputs: ['mass','acceleration'], outputs: ['force'], formula: 'F=ma' },
  { slug: 'hookes-law', name: "Hooke's Law Calculator", category: 'physics', inputs: ['springConstant','displacement'], outputs: ['force'], formula: 'F=-kx' },
  { slug: 'absi', name: 'ABSI Calculator', category: 'health', inputs: ['waist','bmi','height'], outputs: ['absi'], formula: 'waist/(BMI^(2/3)×height^(1/2))' },
  { slug: 'adjusted-body-weight', name: 'Adjusted Body Weight Calculator', category: 'health', inputs: ['idealWeight','actualWeight'], outputs: ['adjustedWeight'], formula: 'IBW+0.4×(ABW-IBW)' },
  { slug: 'daily-calorie-needs', name: 'Daily Calorie Needs Calculator', category: 'health', inputs: ['bmr','activityFactor'], outputs: ['calories'], formula: 'BMR×activityFactor' },
  { slug: 'relative-risk', name: 'Relative Risk Calculator', category: 'statistics', inputs: ['riskExposed','riskUnexposed'], outputs: ['relativeRisk'], formula: 'riskExposed/riskUnexposed' },
  { slug: 'bayes-theorem', name: "Bayes' Theorem Calculator", category: 'statistics', inputs: ['prior','sensitivity','falsePositiveRate'], outputs: ['posterior'], formula: 'P(A|B)=P(B|A)P(A)/P(B)' },
];
