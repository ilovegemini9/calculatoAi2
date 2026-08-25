import assert from 'node:assert/strict';
import { calculateDebtConsolidation } from '../lib/calculators/debtProducts';

const normal = calculateDebtConsolidation(20000, 22.99, 600, 10, 5, 500);
assert.equal(normal.status, 'payable');
assert.ok(normal.newPayment > 0);
assert.ok(normal.newInterest > 0);
assert.ok(normal.totalNewCost > 20500);
assert.ok(Number.isFinite(normal.monthlySavings));

const zero = calculateDebtConsolidation(0, 20, 0, 10, 5, 0);
assert.equal(zero.newPayment, 0);
assert.equal(zero.newInterest, 0);
assert.equal(zero.totalNewCost, 0);

const edge = calculateDebtConsolidation(-10, Number.NaN, Number.NaN, Number.POSITIVE_INFINITY, 0, Number.NaN);
for (const value of [edge.newPayment, edge.monthlySavings, edge.currentInterest, edge.newInterest, edge.totalNewCost]) assert.ok(Number.isFinite(value));
console.log('Debt Consolidation calculator tests passed');
