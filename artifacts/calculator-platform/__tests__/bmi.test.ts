import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBMI } from '../lib/calculators/bmi/formula';

function closeTo(actual: number, expected: number, precision = 2) {
  const margin = 0.5 * Math.pow(10, -precision);
  assert.ok(
    Math.abs(actual - expected) <= margin,
    `Expected ${actual} to be close to ${expected} (±${margin})`
  );
}

describe('calculateBMI — metric', () => {
  it('Normal weight: 80 kg / 180 cm → 24.7', () => {
    // BMI = 80 / 1.8² = 80 / 3.24 = 24.691… → rounds to 24.7
    const r = calculateBMI({ system: 'metric', weight: 80, height: 180 });
    assert.strictEqual(r.bmi, 24.7);
    assert.strictEqual(r.category, 'Normal weight');
  });

  it('Underweight: 50 kg / 170 cm → 17.3', () => {
    // BMI = 50 / 2.89 = 17.301…
    const r = calculateBMI({ system: 'metric', weight: 50, height: 170 });
    assert.strictEqual(r.bmi, 17.3);
    assert.strictEqual(r.category, 'Underweight');
  });

  it('Overweight: 75 kg / 170 cm → 26.0', () => {
    const r = calculateBMI({ system: 'metric', weight: 75, height: 170 });
    assert.strictEqual(r.bmi, 26.0);
    assert.strictEqual(r.category, 'Overweight');
  });

  it('Obese: 90 kg / 170 cm → 31.1', () => {
    const r = calculateBMI({ system: 'metric', weight: 90, height: 170 });
    assert.strictEqual(r.bmi, 31.1);
    assert.strictEqual(r.category, 'Obese');
  });

  it('healthy range text contains kg for metric', () => {
    // min = round(18.5×3.24×10)/10 = 59.9  max = round(24.9×3.24×10)/10 = 80.7
    const r = calculateBMI({ system: 'metric', weight: 80, height: 180 });
    assert.strictEqual(r.healthyRangeText, '59.9 kg - 80.7 kg');
  });

  it('boundary BMI 18.5 → Normal weight', () => {
    const weight = 18.5 * Math.pow(1.70, 2);
    const r = calculateBMI({ system: 'metric', weight, height: 170 });
    assert.strictEqual(r.bmi, 18.5);
    assert.strictEqual(r.category, 'Normal weight');
  });

  it('boundary BMI 25.0 → Overweight', () => {
    const weight = 25.0 * Math.pow(1.70, 2);
    const r = calculateBMI({ system: 'metric', weight, height: 170 });
    assert.strictEqual(r.bmi, 25.0);
    assert.strictEqual(r.category, 'Overweight');
  });

  it('boundary BMI 30.0 → Obese', () => {
    const weight = 30.0 * Math.pow(1.70, 2);
    const r = calculateBMI({ system: 'metric', weight, height: 170 });
    assert.strictEqual(r.bmi, 30.0);
    assert.strictEqual(r.category, 'Obese');
  });
});

describe('calculateBMI — imperial', () => {
  it('150 lbs / 65 in → BMI 25.0 (Overweight)', () => {
    // BMI = 703 × 150 / 65² = 105450 / 4225 = 24.959… → 25.0
    const r = calculateBMI({ system: 'imperial', weight: 150, height: 65 });
    assert.strictEqual(r.bmi, 25.0);
    assert.strictEqual(r.category, 'Overweight');
  });

  it('140 lbs / 70 in → Normal weight', () => {
    // BMI = 703 × 140 / 4900 = 20.085… → 20.1
    const r = calculateBMI({ system: 'imperial', weight: 140, height: 70 });
    assert.strictEqual(r.category, 'Normal weight');
  });

  it('healthy range text contains lbs for imperial', () => {
    const r = calculateBMI({ system: 'imperial', weight: 140, height: 70 });
    assert.ok(r.healthyRangeText.includes('lbs'));
  });

  it('recommendation is non-empty', () => {
    const r = calculateBMI({ system: 'imperial', weight: 140, height: 70 });
    assert.ok(r.recommendation.length > 0);
  });
});
