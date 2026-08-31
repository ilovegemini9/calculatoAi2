import { strict as assert } from 'node:assert';
import { calculate } from '../engine/calculator-engine';

const cases: Array<[string, Record<string, unknown>, string, number]> = [
  ['percentage', { part: 25, whole: 100 }, 'percentage', 25],
  ['percentage-increase', { original: 100, new: 120 }, 'increasePercent', 20],
  ['average', { values: [10, 20, 30] }, 'mean', 20],
  ['square-root', { value: 81 }, 'root', 9],
  ['exponent', { base: 2, exponent: 8 }, 'power', 256],
  ['discount', { price: 200, discountPercent: 15 }, 'finalPrice', 170],
  ['sales-tax', { price: 100, taxPercent: 20 }, 'total', 120],
  ['simple-interest', { principal: 1000, rate: 0.05, time: 2 }, 'interest', 100],
  ['bmi', { weightKg: 80, heightM: 2 }, 'bmi', 20],
  ['speed', { distance: 120, time: 2 }, 'speed', 60],
  ['force', { mass: 10, acceleration: 9.8 }, 'force', 98],
  ['density', { mass: 100, volume: 20 }, 'density', 5],
  ['molarity', { moles: 2, liters: 1 }, 'molarity', 2],
  ['probability', { favorable: 1, total: 4 }, 'probability', 0.25],
  ['pace', { distance: 10, time: 50 }, 'pace', 5],
];

for (const [slug, inputs, key, expected] of cases) {
  const result = calculate(slug, inputs);
  assert.ok(key in result, `${slug}: missing ${key}`);
  assert.ok(Math.abs(Number(result[key]) - expected) < 1e-9, `${slug}: expected ${expected}`);
}

console.log(`Passed ${cases.length} calculator smoke tests`);
