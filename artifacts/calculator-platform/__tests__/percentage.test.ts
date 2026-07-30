import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePercentage } from '../lib/calculators/percentage/formula';

describe('calculatePercentage — percentOf (X% of Y)', () => {
  it('25% of 200 = 50', () => {
    const r = calculatePercentage({ caseType: 'percentOf', x: 25, y: 200 });
    assert.strictEqual(r.result, 50);
    assert.strictEqual(r.explanation, '25% of 200 is 50.');
  });

  it('10% of 350 = 35', () => {
    const r = calculatePercentage({ caseType: 'percentOf', x: 10, y: 350 });
    assert.strictEqual(r.result, 35);
  });

  it('0% of anything = 0', () => {
    assert.strictEqual(calculatePercentage({ caseType: 'percentOf', x: 0, y: 999 }).result, 0);
  });

  it('100% of 42 = 42', () => {
    assert.strictEqual(calculatePercentage({ caseType: 'percentOf', x: 100, y: 42 }).result, 42);
  });

  it('rounds to 4 decimal places (15% of 3 = 0.45)', () => {
    assert.strictEqual(calculatePercentage({ caseType: 'percentOf', x: 15, y: 3 }).result, 0.45);
  });
});

describe('calculatePercentage — whatPercentOf (Y is what % of X)', () => {
  it('50 is 25% of 200', () => {
    const r = calculatePercentage({ caseType: 'whatPercentOf', x: 200, y: 50 });
    assert.strictEqual(r.result, 25);
    assert.strictEqual(r.explanation, '50 is 25% of 200.');
  });

  it('75 is 30% of 250', () => {
    assert.strictEqual(calculatePercentage({ caseType: 'whatPercentOf', x: 250, y: 75 }).result, 30);
  });

  it('divide-by-zero guard: x=0 → result=0 + error explanation', () => {
    const r = calculatePercentage({ caseType: 'whatPercentOf', x: 0, y: 50 });
    assert.strictEqual(r.result, 0);
    assert.strictEqual(r.explanation, 'Cannot divide by zero.');
  });

  it('100 is 100% of 100', () => {
    assert.strictEqual(calculatePercentage({ caseType: 'whatPercentOf', x: 100, y: 100 }).result, 100);
  });
});

describe('calculatePercentage — change (percent change from X to Y)', () => {
  it('100 → 150: +50% increase', () => {
    const r = calculatePercentage({ caseType: 'change', x: 100, y: 150 });
    assert.strictEqual(r.result, 50);
    assert.ok(r.explanation.includes('increase'));
  });

  it('200 → 150: −25% decrease', () => {
    const r = calculatePercentage({ caseType: 'change', x: 200, y: 150 });
    assert.strictEqual(r.result, -25);
    assert.ok(r.explanation.includes('decrease'));
  });

  it('no change: 100 → 100 = 0%', () => {
    assert.strictEqual(calculatePercentage({ caseType: 'change', x: 100, y: 100 }).result, 0);
  });

  it('zero initial guard: x=0 → result=0 + error explanation', () => {
    const r = calculatePercentage({ caseType: 'change', x: 0, y: 100 });
    assert.strictEqual(r.result, 0);
    assert.strictEqual(r.explanation, 'Initial value (X) cannot be zero for percent change.');
  });

  it('300 → 400: 33.3333% (rounds to 4 dp)', () => {
    assert.strictEqual(calculatePercentage({ caseType: 'change', x: 300, y: 400 }).result, 33.3333);
  });

  it('1000 → 1: −99.9% decrease', () => {
    assert.strictEqual(calculatePercentage({ caseType: 'change', x: 1000, y: 1 }).result, -99.9);
  });
});
