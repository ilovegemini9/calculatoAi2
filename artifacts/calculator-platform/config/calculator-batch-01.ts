export type CalculatorCategory = 'math' | 'finance' | 'physics' | 'health' | 'conversion' | 'everyday-life' | 'statistics' | 'construction' | 'biology' | 'sports' | 'chemistry' | 'food' | 'ecology' | 'other';

export interface CalculatorSpec {
  slug: string;
  name: string;
  category: CalculatorCategory;
  inputs: string[];
  outputs: string[];
  formula: string;
  reverseSolving?: string[];
}

export const CALCULATOR_BATCH_01: CalculatorSpec[] = [
  { slug: 'percentage', name: 'Percentage Calculator', category: 'math', inputs: ['part', 'whole'], outputs: ['percentage'], formula: 'percentage = part / whole × 100', reverseSolving: ['part = percentage × whole / 100', 'whole = part × 100 / percentage'] },
  { slug: 'percentage-increase', name: 'Percentage Increase Calculator', category: 'math', inputs: ['original', 'new'], outputs: ['increasePercent'], formula: '(new - original) / original × 100' },
  { slug: 'percentage-decrease', name: 'Percentage Decrease Calculator', category: 'math', inputs: ['original', 'new'], outputs: ['decreasePercent'], formula: '(original - new) / original × 100' },
  { slug: 'average', name: 'Average Calculator', category: 'math', inputs: ['values'], outputs: ['mean'], formula: 'sum(values) / count(values)' },
  { slug: 'square-root', name: 'Square Root Calculator', category: 'math', inputs: ['value'], outputs: ['root'], formula: '√value' },
  { slug: 'exponent', name: 'Exponent Calculator', category: 'math', inputs: ['base', 'exponent'], outputs: ['power'], formula: 'base^exponent' },
  { slug: 'circumference', name: 'Circumference Calculator', category: 'math', inputs: ['radius'], outputs: ['circumference'], formula: '2πr', reverseSolving: ['r = circumference / (2π)'] },
  { slug: 'slope', name: 'Slope Calculator', category: 'math', inputs: ['x1', 'y1', 'x2', 'y2'], outputs: ['slope'], formula: '(y2 - y1) / (x2 - x1)' },
  { slug: 'pythagorean-theorem', name: 'Pythagorean Theorem Calculator', category: 'math', inputs: ['a', 'b'], outputs: ['c'], formula: 'c = √(a² + b²)', reverseSolving: ['a = √(c² - b²)', 'b = √(c² - a²)'] },
  { slug: 'scientific-notation', name: 'Scientific Notation Calculator', category: 'math', inputs: ['value'], outputs: ['coefficient', 'exponent'], formula: 'value = coefficient × 10^exponent' },
  { slug: 'logarithm', name: 'Logarithm Calculator', category: 'math', inputs: ['value', 'base'], outputs: ['log'], formula: 'log_base(value) = ln(value) / ln(base)' },
  { slug: 'discount', name: 'Discount Calculator', category: 'finance', inputs: ['price', 'discountPercent'], outputs: ['discountAmount', 'finalPrice'], formula: 'discountAmount = price × discountPercent / 100; finalPrice = price - discountAmount' },
  { slug: 'sales-tax', name: 'Sales Tax Calculator', category: 'finance', inputs: ['price', 'taxPercent'], outputs: ['taxAmount', 'total'], formula: 'taxAmount = price × taxPercent / 100; total = price + taxAmount' },
  { slug: 'margin', name: 'Profit Margin Calculator', category: 'finance', inputs: ['revenue', 'cost'], outputs: ['marginPercent', 'profit'], formula: 'profit = revenue - cost; marginPercent = profit / revenue × 100' },
  { slug: 'markup', name: 'Markup Calculator', category: 'finance', inputs: ['cost', 'sellingPrice'], outputs: ['markupPercent'], formula: '(sellingPrice - cost) / cost × 100' },
  { slug: 'simple-interest', name: 'Simple Interest Calculator', category: 'finance', inputs: ['principal', 'rate', 'time'], outputs: ['interest', 'total'], formula: 'interest = principal × rate × time; total = principal + interest' },
  { slug: 'compound-interest', name: 'Compound Interest Calculator', category: 'finance', inputs: ['principal', 'rate', 'periods', 'time'], outputs: ['total', 'interest'], formula: 'total = principal × (1 + rate / periods)^(periods × time)' },
  { slug: 'bmi', name: 'BMI Calculator', category: 'health', inputs: ['weightKg', 'heightM'], outputs: ['bmi'], formula: 'BMI = weightKg / heightM²' },
  { slug: 'bmr', name: 'BMR Calculator', category: 'health', inputs: ['weightKg', 'heightCm', 'age', 'sex'], outputs: ['bmr'], formula: 'Mifflin-St Jeor equation' },
  { slug: 'calorie', name: 'Calorie Calculator', category: 'health', inputs: ['bmr', 'activityFactor'], outputs: ['dailyCalories'], formula: 'dailyCalories = bmr × activityFactor' },
  { slug: 'speed', name: 'Speed Calculator', category: 'physics', inputs: ['distance', 'time'], outputs: ['speed'], formula: 'speed = distance / time', reverseSolving: ['distance = speed × time', 'time = distance / speed'] },
  { slug: 'force', name: 'Force Calculator', category: 'physics', inputs: ['mass', 'acceleration'], outputs: ['force'], formula: 'F = m × a', reverseSolving: ['m = F / a', 'a = F / m'] },
  { slug: 'density', name: 'Density Calculator', category: 'physics', inputs: ['mass', 'volume'], outputs: ['density'], formula: 'density = mass / volume', reverseSolving: ['mass = density × volume', 'volume = mass / density'] },
  { slug: 'acceleration', name: 'Acceleration Calculator', category: 'physics', inputs: ['deltaVelocity', 'time'], outputs: ['acceleration'], formula: 'a = Δv / t' },
  { slug: 'molarity', name: 'Molarity Calculator', category: 'chemistry', inputs: ['moles', 'liters'], outputs: ['molarity'], formula: 'M = moles / liters' },
  { slug: 'probability', name: 'Probability Calculator', category: 'statistics', inputs: ['favorable', 'total'], outputs: ['probability'], formula: 'P = favorable / total' },
  { slug: 'z-score', name: 'Z-score Calculator', category: 'statistics', inputs: ['value', 'mean', 'standardDeviation'], outputs: ['z'], formula: 'z = (value - mean) / standardDeviation' },
  { slug: 'pace', name: 'Pace Calculator', category: 'sports', inputs: ['distance', 'time'], outputs: ['pace'], formula: 'pace = time / distance' },
  { slug: 'square-footage', name: 'Square Footage Calculator', category: 'construction', inputs: ['length', 'width'], outputs: ['area'], formula: 'area = length × width' },
  { slug: 'volume', name: 'Volume Calculator', category: 'construction', inputs: ['length', 'width', 'height'], outputs: ['volume'], formula: 'volume = length × width × height' },
];
