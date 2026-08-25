import assert from 'node:assert/strict';
import { calculateDti } from '../lib/calculators/debtProducts';

const result = calculateDti(6000, 1000, 1500, 500);
assert.equal(result.monthlyDebt, 2500);
assert.equal(result.dti, 41.7);
assert.equal(result.proposedDti, 50);
assert.equal(result.status, 'high');
assert.equal(result.headroom, 0);

const within = calculateDti(10000, 1000, 1000, 500);
assert.equal(within.dti, 20);
assert.equal(within.proposedDti, 25);
assert.equal(within.status, 'within-range');
assert.equal(within.headroom, 11);

const zero = calculateDti(0, 1000, 1000, 500);
assert.equal(zero.dti, 0);
assert.equal(zero.proposedDti, 0);
assert.equal(zero.status, 'within-range');

const edge = calculateDti(Number.NaN, -1, Number.POSITIVE_INFINITY, Number.NaN);
for (const value of [edge.grossMonthlyIncome, edge.monthlyDebt, edge.dti, edge.proposedDti, edge.headroom]) assert.ok(Number.isFinite(value));
console.log('Debt-to-Income calculator tests passed');
