import assert from 'node:assert/strict';
import { calculateCashBackLowInterest, calculateCompoundInterest, calculateInterest, calculateInterestRate, calculateSimpleInterest } from '../lib/calculators/interestProducts';

const simple = calculateSimpleInterest(10000, 5, 5);
assert.equal(simple.interest, 2500);
assert.equal(simple.total, 12500);
const interest = calculateInterest(10000, 5, 5, false, 12);
assert.equal(interest.interest, 2500);

const compound = calculateCompoundInterest(10000, 5, 5, 12, 100);
assert.ok(compound.total > 10000);
assert.ok(compound.contributions > 0);
assert.equal(compound.periods, 60);
const rate = calculateInterestRate(10000, 12500, 5, 12);
assert.ok(rate.rate > 0);

const choice = calculateCashBackLowInterest(10000, 3, 0, 5, 60);
assert.equal(choice.cashback, 300);
assert.ok(Number.isFinite(choice.savings));
assert.ok(choice.better === 'low-interest' || choice.better === 'cash-back');

for (const value of [calculateSimpleInterest(-1, Number.NaN, Number.POSITIVE_INFINITY).total, calculateCompoundInterest(-1, Number.NaN, Number.NaN, 0, -1).total, calculateInterestRate(0, 100, 0, 0).rate]) assert.ok(Number.isFinite(value));
assert.equal(calculateSimpleInterest(100, 0, 5).interest, 0);
console.log('Interest tools tests passed');
