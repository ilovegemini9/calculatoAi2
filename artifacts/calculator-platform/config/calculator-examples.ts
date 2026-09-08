import { calculate, getCalculatorSpec, type CalculatorInputs } from './calculator-engine';

const SAMPLE_INPUTS: Record<string, CalculatorInputs> = {
  percentage: { part: 20, whole: 80 },
  'percentage-increase': { original: 80, new: 100 },
  'percentage-decrease': { original: 100, new: 80 },
  average: { values: [10, 20, 30, 40] },
  mean: { values: [10, 20, 30, 40] },
  median: { values: [10, 20, 30, 40, 50] },
  mode: { values: [2, 3, 3, 4, 5] },
  'standard-deviation': { values: [10, 12, 14, 16, 18] },
  variance: { values: [10, 12, 14, 16, 18] },
  'square-root': { value: 144 },
  'cube-root': { value: 125 },
  root: { value: 81, index: 4 },
  exponent: { base: 2, exponent: 8 },
  modulo: { dividend: 17, divisor: 5 },
  gcd: { values: [24, 36] },
  lcm: { values: [12, 18] },
  factorial: { n: 5 },
  permutation: { n: 5, r: 2 },
  combination: { n: 5, r: 2 },
  'absolute-value': { x: -12 },
  'absolute-change': { oldValue: 80, newValue: 95 },
  slope: { x1: 1, y1: 2, x2: 4, y2: 8 },
  'distance-between-points': { x1: 0, y1: 0, x2: 3, y2: 4 },
  midpoint: { x1: 2, y1: 4, x2: 8, y2: 10 },
  circumference: { radius: 5 },
  'circle-area': { radius: 5 },
  'circle-diameter': { radius: 5 },
  'rectangle-area': { length: 8, width: 5 },
  'rectangle-perimeter': { length: 8, width: 5 },
  'triangle-area': { base: 10, height: 6 },
  'triangle-perimeter': { a: 3, b: 4, c: 5 },
  square: { side: 4 },
  cube: { side: 3 },
  'pythagorean-theorem': { a: 3, b: 4 },
  'herons-formula': { a: 3, b: 4, c: 5 },
  'sector-area': { radius: 6, angle: 90 },
  'arc-length': { radius: 6, angle: 90 },
  discount: { price: 120, discountPercent: 15 },
  'sales-tax': { price: 120, taxPercent: 20 },
  margin: { revenue: 1000, cost: 650 },
  markup: { cost: 80, sellingPrice: 100 },
  'simple-interest': { principal: 1000, rate: 0.05, time: 2 },
  'compound-interest': { principal: 1000, rate: 0.05, periods: 12, time: 2 },
  roi: { gain: 1250, cost: 1000 },
  commission: { sales: 5000, commissionRate: 10 },
  tip: { bill: 80, tipPercent: 15, people: 4 },
  'debt-to-income': { monthlyDebt: 1200, grossMonthlyIncome: 4000 },
  inflation: { amount: 1000, inflationRate: 0.03, years: 5 },
  'future-value': { presentValue: 1000, rate: 0.05, periods: 10 },
  'present-value': { futureValue: 1628.89, rate: 0.05, periods: 10 },
  'break-even': { fixedCosts: 2000, pricePerUnit: 50, variableCostPerUnit: 30 },
  'price-per-unit': { totalPrice: 60, quantity: 12 },
  'hourly-to-salary': { hourlyRate: 25, hoursPerWeek: 40, weeksPerYear: 52 },
  'salary-to-hourly': { salary: 52000, hoursPerWeek: 40, weeksPerYear: 52 },
  speed: { distance: 120, time: 2 },
  acceleration: { deltaVelocity: 20, time: 4 },
  force: { mass: 10, acceleration: 3 },
  density: { mass: 100, volume: 20 },
  'kinetic-energy': { mass: 10, velocity: 20 },
  'potential-energy': { mass: 10, gravity: 9.81, height: 5 },
  work: { force: 50, distance: 4, angle: 0 },
  power: { work: 1000, time: 20 },
  pressure: { force: 100, area: 5 },
  'ohms-law': { voltage: 12, current: 2 },
  momentum: { mass: 10, velocity: 20 },
  impulse: { force: 50, time: 0.4 },
  frequency: { cycles: 60, time: 10 },
  wavelength: { waveSpeed: 340, frequency: 170 },
  period: { frequency: 2 },
  'angular-velocity': { angle: 12.566370614359172, time: 4 },
  torque: { leverArm: 2, force: 50, angle: 90 },
  'specific-heat': { heat: 4200, mass: 1, temperatureChange: 10 },
  'heat-transfer': { mass: 1, specificHeat: 4200, temperatureChange: 10 },
  molarity: { moles: 0.5, liters: 2 },
  ph: { hydrogenIonConcentration: 0.000001 },
  'mass-moles': { mass: 18, molarMass: 18 },
  'moles-mass': { moles: 2, molarMass: 18 },
  'percent-yield': { actualYield: 8, theoreticalYield: 10 },
  'mole-fraction': { componentMoles: 2, totalMoles: 10 },
  probability: { favorable: 3, total: 10 },
  'z-score': { value: 75, mean: 70, standardDeviation: 5 },
  'weighted-average': { values: [80, 90, 70], weights: [0.2, 0.5, 0.3] },
  'geometric-mean': { values: [2, 8, 32] },
  'harmonic-mean': { values: [2, 4, 8] },
  rounding: { value: 12.3456, decimalPlaces: 2 },
  'significant-figures': { value: 12345.67, figures: 4 },
  'unit-rate': { quantity: 240, units: 6 },
  cagr: { beginning: 1000, ending: 1331, years: 3 },
  'calorie-deficit': { maintenanceCalories: 2200, targetCalories: 1800 },
  bmi: { weightKg: 70, heightM: 1.75 },
  'bmi-prime': { bmi: 24.5 },
  calorie: { bmr: 1600, activityFactor: 1.5 },
  tdee: { bmr: 1600, activityFactor: 1.5 },
  'calorie-burn': { met: 8, weight: 70, duration: 30 },
  pace: { time: 30, distance: 5 },
  'running-pace': { time: 30, distance: 5 },
  'running-speed': { distance: 10, time: 1 },
  'cycling-speed': { distance: 30, time: 1.5 },
  'baseball-batting-average': { hits: 3, atBats: 10 },
  'miles-per-hour-to-kmh': { mph: 60 },
  'kmh-to-mph': { kmh: 100 },
  'kilometers-to-miles': { kilometers: 10 },
  'miles-to-kilometers': { miles: 10 },
  'pounds-to-kilograms': { pounds: 10 },
  'kilograms-to-pounds': { kilograms: 10 },
  'liters-to-gallons': { liters: 10 },
  'gallons-to-liters': { gallons: 10 },
  'square-meters-to-square-feet': { squareMeters: 10 },
  'square-feet-to-square-meters': { squareFeet: 100 },
  'newtons-to-pounds-force': { newtons: 100 },
  'watts-to-horsepower': { watts: 1000 },
  'hours-to-minutes': { hours: 2 },
  'minutes-to-seconds': { minutes: 5 },
  'celsius-to-fahrenheit': { celsius: 20 },
  'fahrenheit-to-celsius': { fahrenheit: 68 },
  'meters-to-feet': { meters: 10 },
  'feet-to-meters': { feet: 10 },
  'confidence-interval': { sampleMean: 100, standardDeviation: 10, sampleSize: 100 },
  percentile: { values: [10, 20, 30, 40, 50], target: 75 },
  quartile: { values: [10, 20, 30, 40, 50] },
  ratio: { a: 2, b: 3 },
  proportion: { a: 2, b: 3, c: 8 },
  'fraction-to-decimal': { numerator: 3, denominator: 4 },
  'decimal-to-fraction': { decimal: 0.75 },
  'quadratic-equation': { a: 1, b: -5, c: 6 },
  'compound-growth': { initial: 1000, growthRate: 0.1, periods: 2 },
  mortgage: { principal: 200000, annualRate: 6, years: 30 },
  'fuel-cost': { distance: 500, efficiency: 10, fuelPrice: 1.5 },
  'real-estate-commission': { salePrice: 300000, commissionRate: 5 },
  'sales-profit': { revenue: 5000, expenses: 3500 },
  'celsius-to-kelvin': { celsius: 25 },
  'kelvin-to-celsius': { kelvin: 298.15 },
  'molarity-dilution': { initialMolarity: 2, initialVolume: 0.5, finalMolarity: 0.5 },
  'linear-regression-slope': { xValues: [1, 2, 3], yValues: [2, 4, 5] },
  'percentile-rank': { values: [10, 20, 30, 40, 50], value: 40 },
  'bmr-mifflin-st-jeor': { weightKg: 70, heightCm: 175, age: 30, sex: 'male' },
  'ideal-weight': { heightCm: 175 },
  'body-fat-estimate': { bmi: 23, age: 30, sex: 'male' },
  'water-intake': { weightKg: 70 },
  'protein-intake': { weightKg: 70, gramsPerKg: 1.6 },
  'heart-rate-max': { age: 30 },
  'calories-burned': { met: 6, weightKg: 70, hours: 1 },
  'pregnancy-due-date': { lastPeriod: '2026-01-01' },
  ovulation: { cycleLength: 28 },
  'ph-to-hydrogen-ion': { pH: 6 },
  'gas-law': { initialPressure: 1, initialVolume: 10, finalTemperature: 300, finalPressure: 2, initialTemperature: 300 },
  'density-mass': { density: 2, volume: 10 },
  'density-volume': { mass: 20, density: 2 },
  'molar-mass': { mass: 36, moles: 2 },
  'square-footage': { length: 20, width: 15 },
  volume: { length: 4, width: 3, height: 2 },
  'cylinder-volume': { radius: 3, height: 10 },
  'sphere-volume': { radius: 3 },
  'cone-volume': { radius: 3, height: 10 },
  'surface-area-sphere': { radius: 3 },
  'surface-area-cylinder': { radius: 3, height: 10 },
  'angular-speed': { angle: 12.566370614359172, time: 4 },
  'centripetal-force': { mass: 10, velocity: 20, radius: 5 },
  'wave-speed': { frequency: 5, wavelength: 2 },
  'electric-power': { voltage: 12, current: 2 },
  'electric-energy': { power: 100, time: 10 },
  resistance: { voltage: 12, current: 2 },
  current: { voltage: 12, resistance: 6 },
  voltage: { current: 2, resistance: 6 },
};

function genericSample(key: string): number | string | number[] {
  if (key === 'values' || key.endsWith('Values')) return [10, 20, 30];
  if (key === 'weights') return [1, 2, 1];
  if (key === 'sex') return 'male';
  if (key === 'lastPeriod') return '2026-01-01';
  if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate')) return 0.05;
  if (key.toLowerCase().includes('angle')) return 0;
  if (key.toLowerCase().includes('decimalplaces') || key === 'figures' || key === 'index') return 2;
  if (key === 'cycles') return 60;
  return 10;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) return value.toPrecision(6).replace(/\.0+$/, '');
  return Number(value.toFixed(4)).toString();
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') return formatNumber(value);
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v)).join(', ')}]`;
  return String(value);
}

export interface NumericWorkedExample {
  scenario: string;
  steps: string[];
  result: string;
}

export function buildNumericWorkedExample(slug: string): NumericWorkedExample | null {
  try {
    const spec = getCalculatorSpec(slug);
    const inputs = SAMPLE_INPUTS[slug] ?? Object.fromEntries(spec.inputs.map((key) => [key, genericSample(key)]));
    const result = calculate(slug, inputs);
    const steps = spec.inputs.map((key) => `Enter ${key.replace(/[-_]/g, ' ')} = ${formatValue(inputs[key])}.`);
    const calculation = spec.formula.replace(/\s+/g, ' ').trim();
    steps.push(`Apply the formula: ${calculation}.`);
    const outputs = spec.outputs.map((key) => `${key.replace(/[-_]/g, ' ')} = ${formatValue(result[key])}`).join('; ');
    return {
      scenario: `Example: calculate ${spec.name.toLowerCase()} using concrete sample values.`,
      steps,
      result: `Result: ${outputs}.`,
    };
  } catch {
    return null;
  }
}
