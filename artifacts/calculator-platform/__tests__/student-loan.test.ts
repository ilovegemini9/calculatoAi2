import assert from 'node:assert/strict';
import { calculateStudentLoan } from '../lib/calculators/loanProducts';

const scheduled = calculateStudentLoan({ principal: 30000, annualRate: 5.5, termYears: 10, originationFeeRate: 1, extraMonthlyPayment: 0 });
assert.equal(scheduled.originationFee, 300);
assert.equal(scheduled.financedAmount, 30300);
assert.equal(scheduled.payoffMonths, 120);
assert.equal(scheduled.amortization.at(-1)?.balance, 0);

const accelerated = calculateStudentLoan({ principal: 30000, annualRate: 5.5, termYears: 10, originationFeeRate: 1, extraMonthlyPayment: 100 });
assert.ok(accelerated.payoffMonths < scheduled.payoffMonths);
assert.ok(accelerated.interestSaved > 0);
assert.ok(accelerated.totalInterest < scheduled.totalInterest);

const zero = calculateStudentLoan({ principal: 12000, annualRate: 0, termYears: 4, originationFeeRate: 0, extraMonthlyPayment: 0 });
assert.equal(zero.scheduledPayment, 250);
assert.equal(zero.payoffMonths, 48);
assert.equal(zero.totalInterest, 0);

const edge = calculateStudentLoan({ principal: -1, annualRate: Number.NaN, termYears: 0, originationFeeRate: Number.POSITIVE_INFINITY, extraMonthlyPayment: -5 });
for (const value of [edge.monthlyPayment, edge.totalInterest, edge.totalCost, edge.originationFee]) assert.ok(Number.isFinite(value));
assert.equal(edge.financedAmount, 0);
console.log('Student Loan calculator tests passed');
