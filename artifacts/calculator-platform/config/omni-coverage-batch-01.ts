export type CoverageSpec = {
  slug: string;
  category: string;
  inputs: string[];
  outputs: string[];
  formula: string;
};

// Reference inventory only: these specs describe common calculation problems,
// not copied source code or editorial text from Omni Calculator.
export const OMNI_COVERAGE_BATCH_01: CoverageSpec[] = [
  { slug: 'percentage', category: 'math', inputs: ['value','percentage'], outputs: ['percentage-of-value'], formula: 'result = value × percentage / 100' },
  { slug: 'percentage-increase', category: 'math', inputs: ['original','new'], outputs: ['increase','percent-increase'], formula: 'increase = new − original; percentIncrease = increase / original × 100' },
  { slug: 'percentage-decrease', category: 'math', inputs: ['original','new'], outputs: ['decrease','percent-decrease'], formula: 'decrease = original − new; percentDecrease = decrease / original × 100' },
  { slug: 'average', category: 'math', inputs: ['values'], outputs: ['mean'], formula: 'mean = sum(values) / count(values)' },
  { slug: 'square-root', category: 'math', inputs: ['value'], outputs: ['square-root'], formula: 'result = √value' },
  { slug: 'exponent', category: 'math', inputs: ['base','exponent'], outputs: ['power'], formula: 'result = base^exponent' },
  { slug: 'discount', category: 'finance', inputs: ['price','discount-percent'], outputs: ['discount-amount','sale-price'], formula: 'discount = price × rate; salePrice = price − discount' },
  { slug: 'sales-tax', category: 'finance', inputs: ['price','tax-rate'], outputs: ['tax','total'], formula: 'tax = price × rate; total = price + tax' },
  { slug: 'unit-price', category: 'everyday-life', inputs: ['total-price','quantity'], outputs: ['price-per-unit'], formula: 'unitPrice = totalPrice / quantity' },
  { slug: 'time-difference', category: 'everyday-life', inputs: ['start','end'], outputs: ['duration'], formula: 'duration = end − start' },
  { slug: 'bmi', category: 'health', inputs: ['weight','height'], outputs: ['bmi'], formula: 'BMI = weight / height² (SI units)' },
  { slug: 'calorie', category: 'health', inputs: ['age','sex','height','weight','activity'], outputs: ['estimated-daily-energy'], formula: 'estimate = validated BMR equation × activity factor' },
  { slug: 'density', category: 'physics', inputs: ['mass','volume'], outputs: ['density'], formula: 'density = mass / volume' },
  { slug: 'speed', category: 'physics', inputs: ['distance','time'], outputs: ['speed'], formula: 'speed = distance / time' },
  { slug: 'force', category: 'physics', inputs: ['mass','acceleration'], outputs: ['force'], formula: 'F = m × a' },
  { slug: 'molarity', category: 'chemistry', inputs: ['moles','solution-volume'], outputs: ['molarity'], formula: 'M = moles / volume' },
  { slug: 'probability', category: 'statistics', inputs: ['favorable-outcomes','total-outcomes'], outputs: ['probability'], formula: 'P = favorable / total' },
  { slug: 'confidence-interval', category: 'statistics', inputs: ['sample-statistic','standard-error','confidence-level'], outputs: ['interval'], formula: 'interval = estimate ± critical-value × standard-error' },
  { slug: 'pace', category: 'sports', inputs: ['distance','time'], outputs: ['pace'], formula: 'pace = time / distance' },
  { slug: 'square-footage', category: 'construction', inputs: ['length','width'], outputs: ['area'], formula: 'area = length × width' },
];
