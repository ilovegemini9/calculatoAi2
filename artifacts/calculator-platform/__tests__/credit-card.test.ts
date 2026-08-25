import assert from 'node:assert/strict';
import { calculateCreditCard } from '../lib/calculators/debtProducts';

const standard = calculateCreditCard(12000, 22.99, 2, 25);
assert.equal(standard.minimumPayment, 240);
assert.equal(standard.status, 'payable');
assert.ok(standard.payments > 0);
assert.ok(standard.totalInterest > 0);

const floor = calculateCreditCard(500, 22.99, 2, 25);
assert.equal(floor.minimumPayment, 25);
assert.equal(floor.status, 'payable');
assert.ok(floor.payments > 0);

const tooLow = calculateCreditCard(10000, 30, 0.1, 1);
assert.equal(tooLow.status, 'payment-too-low');
assert.equal(tooLow.payments, 0);

const zero = calculateCreditCard(0, 30, 2, 25);
assert.equal(zero.status, 'no-balance');
assert.equal(zero.totalInterest, 0);

const edge = calculateCreditCard(-10, Number.NaN, Number.POSITIVE_INFINITY, Number.NaN);
for (const value of [edge.minimumPayment, edge.totalInterest, edge.totalPayments]) assert.ok(Number.isFinite(value));
console.log('Credit Card calculator tests passed');
