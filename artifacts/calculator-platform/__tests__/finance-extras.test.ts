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
