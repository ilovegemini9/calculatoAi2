import assert from 'node:assert/strict';
import { simulatePayoff } from '../lib/calculators/debtProducts';

const normal = simulatePayoff(12000, 22.99, 350);
assert.equal(normal.status, 'payable');
assert.ok(normal.payments > 0);
assert.ok(normal.totalInterest > 0);

const low = simulatePayoff(10000, 30, 50);
assert.equal(low.status, 'payment-too-low');
assert.equal(low.payments, 0);

const zero = simulatePayoff(0, 30, 50);
assert.equal(zero.status, 'no-balance');
assert.equal(zero.totalInterest, 0);

const edge = simulatePayoff(-10, Number.NaN, Number.POSITIVE_INFINITY);
for (const value of [edge.monthlyPayment, edge.totalPayments, edge.totalInterest]) assert.ok(Number.isFinite(value));
console.log('Debt Payoff calculator tests passed');
