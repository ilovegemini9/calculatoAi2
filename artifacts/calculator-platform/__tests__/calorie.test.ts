import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCalorie } from '../lib/calculators/calorie/formula';

describe('calculateCalorie — Mifflin-St Jeor (male/metric)', () => {
  const base = {
    system: 'metric' as const, gender: 'male' as const,
    age: 30, weight: 80, height: 180, activity: 'sedentary' as const,
  };

  it('BMR = 10×80 + 6.25×180 − 5×30 + 5 = 1780', () => {
    assert.strictEqual(calculateCalorie(base).bmr, 1780);
  });

  it('TDEE = 1780 × 1.2 = 2136 (sedentary)', () => {
    const r = calculateCalorie(base);
    assert.strictEqual(r.tdee, 2136);
    assert.strictEqual(r.maintain, 2136);
  });

  it('goal targets are offset from maintain', () => {
    const r = calculateCalorie(base);
    assert.strictEqual(r.mildLoss,    r.maintain - 250);
    assert.strictEqual(r.weightLoss,  r.maintain - 500);
    assert.strictEqual(r.extremeLoss, r.maintain - 1000);
    assert.strictEqual(r.mildGain,    r.maintain + 250);
    assert.strictEqual(r.weightGain,  r.maintain + 500);
  });

  it('active multiplier produces higher TDEE than sedentary', () => {
    const active = calculateCalorie({ ...base, activity: 'active' });
    assert.ok(active.tdee > calculateCalorie(base).tdee);
  });
});

describe('calculateCalorie — female/metric', () => {
  it('BMR applies female offset −161: 25yo 60kg 165cm = 1345', () => {
    // 10×60 + 6.25×165 − 5×25 − 161 = 600+1031.25−125−161 = 1345.25 → 1345
    const r = calculateCalorie({
      system: 'metric', gender: 'female', age: 25,
      weight: 60, height: 165, activity: 'moderate',
    });
    assert.strictEqual(r.bmr, 1345);
  });

  it('TDEE for moderate (1.55): 1345.25×1.55 = 2085.14 → 2085', () => {
    const r = calculateCalorie({
      system: 'metric', gender: 'female', age: 25,
      weight: 60, height: 165, activity: 'moderate',
    });
    assert.strictEqual(r.tdee, 2085);
  });
});

describe('calculateCalorie — imperial conversion', () => {
  it('imperial 176.37 lbs / 70.87 in ≈ metric 80 kg / 180 cm (within 10 kcal)', () => {
    const metric = calculateCalorie({
      system: 'metric', gender: 'male', age: 30,
      weight: 80, height: 180, activity: 'sedentary',
    });
    const imperial = calculateCalorie({
      system: 'imperial', gender: 'male', age: 30,
      weight: 176.37, height: 70.87, activity: 'sedentary',
    });
    assert.ok(Math.abs(imperial.bmr - metric.bmr) < 10);
  });
});

describe('calculateCalorie — invariants', () => {
  it('tdee > bmr for any non-sedentary activity', () => {
    const r = calculateCalorie({
      system: 'metric', gender: 'male', age: 40,
      weight: 85, height: 175, activity: 'very_active',
    });
    assert.ok(r.tdee > r.bmr);
  });

  it('extremeLoss < weightLoss < mildLoss < maintain', () => {
    const r = calculateCalorie({
      system: 'metric', gender: 'female', age: 35,
      weight: 70, height: 168, activity: 'light',
    });
    assert.ok(r.extremeLoss < r.weightLoss);
    assert.ok(r.weightLoss < r.mildLoss);
    assert.ok(r.mildLoss < r.maintain);
  });

  it('weightGain > mildGain > maintain', () => {
    const r = calculateCalorie({
      system: 'metric', gender: 'male', age: 22,
      weight: 65, height: 175, activity: 'moderate',
    });
    assert.ok(r.weightGain > r.mildGain);
    assert.ok(r.mildGain > r.maintain);
  });
});
