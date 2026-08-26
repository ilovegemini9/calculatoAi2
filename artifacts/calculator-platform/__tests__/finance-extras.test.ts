import assert from 'node:assert/strict';
import { emergencyFund } from '../lib/calculators/financeExtras';

const result = emergencyFund(3500, 6, 7000, 1000);
assert.equal(result.targetAmount, 21000);
assert.equal(result.savingsGap, 14000);
assert.equal(result.monthsToGoal, 14);
assert.equal(result.currentCoverageMonths, 2);

const funded = emergencyFund(3000, 3, 10000, 0);
assert.equal(funded.savingsGap, 0);
assert.equal(funded.monthsToGoal, 0);

const noSchedule = emergencyFund(3000, 6, 1000, 0);
assert.equal(noSchedule.monthsToGoal, null);

assert.ok(emergencyFund(0, 6, 1000, 100).error);
console.log('Finance extras production tests passed');

import { calculateCagr, loanToValue, splitBill } from '../lib/calculators/financeExtras';

const cagr = calculateCagr('cagr', 1000, 1300, 3);
assert.ok(Math.abs(cagr.result - 9.1397) < 0.01);
assert.equal(Math.round(cagr.totalGrowthPercent), 30);
const future = calculateCagr('future-value', 5000, 0, 5, 8);
assert.ok(Math.abs(future.result - 7346.64) < 0.01);
const initial = calculateCagr('initial-value', 0, 10000, 5, 10);
assert.ok(Math.abs(initial.result - 6209.21) < 0.01);
assert.ok(calculateCagr('cagr', 1000, 1300, 0).error);

const ltv = loanToValue(320000, 400000, 20000);
assert.equal(ltv.ltvPercent, 80);
assert.equal(ltv.cltvPercent, 85);
assert.equal(ltv.equityAmount, 80000);
assert.equal(ltv.equityPercent, 20);
assert.ok(loanToValue(100, 0).error);

const split = splitBill(250, 10, 4, 10);
assert.equal(split.adjustedBill, 260);
assert.equal(split.tipAmount, 26);
assert.equal(split.grandTotal, 286);
assert.equal(split.perPerson, 71.5);
assert.equal(split.people, 4);

console.log('Finance parity production tests passed');
