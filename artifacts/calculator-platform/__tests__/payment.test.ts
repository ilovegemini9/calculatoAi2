import assert from 'node:assert/strict';
import { calculatePayment } from '../lib/calculators/loanProducts';

const result = calculatePayment({ principal: 25000, annualRate: 6.5, termYears: 5, fees: 0 });
const rate = 0.065 / 12;
const expected = 25000 * (rate * Math.pow(1 + rate, 60)) / (Math.pow(1 + rate, 60) - 1);
assert.ok(Math.abs(result.monthlyPayment - expected) < 0.01);
assert.equal(result.termMonths, 60);
assert.equal(result.amortization.at(-1)?.balance, 0);
assert.ok(result.totalInterest > 0);
assert.equal(result.totalCost, result.financedAmount + result.totalInterest);

const zero = calculatePayment({ principal: 25000, annualRate: 0, termYears: 2, fees: 500 });
assert.equal(zero.monthlyPayment, 1062.5);
assert.equal(zero.totalInterest, 0);
assert.equal(zero.amortization.at(-1)?.balance, 0);

const edge = calculatePayment({ principal: -100, annualRate: Number.NaN, termYears: 0, fees: Number.POSITIVE_INFINITY });
for (const value of [edge.monthlyPayment, edge.totalInterest, edge.totalCost, edge.financedAmount]) assert.ok(Number.isFinite(value));
assert.equal(edge.financedAmount, 0);
console.log('Payment calculator tests passed');
