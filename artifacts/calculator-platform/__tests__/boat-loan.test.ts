import assert from 'node:assert/strict';
import { calculateBoatLoan } from '../lib/calculators/boat-loan/formula';

const standard = calculateBoatLoan({ boatPrice: 65000, downPayment: 10000, tradeInValue: 0, salesTaxRate: 6.5, fees: 1500, interestRate: 7.25, termYears: 10 });
assert.equal(standard.amountFinanced, 60075);
assert.equal(standard.termMonths, 120);
assert.ok(standard.monthlyPayment > 0);
assert.equal(standard.amortization.at(-1)?.balance, 0);
assert.ok(Number.isFinite(standard.totalInterest));

const zeroRate = calculateBoatLoan({ boatPrice: 24000, downPayment: 0, tradeInValue: 0, salesTaxRate: 0, fees: 0, interestRate: 0, termYears: 5 });
assert.equal(zeroRate.monthlyPayment, 400);
assert.equal(zeroRate.totalInterest, 0);
assert.equal(zeroRate.totalPayments, 24000);

const edge = calculateBoatLoan({ boatPrice: -10, downPayment: 999999, tradeInValue: 999999, salesTaxRate: -5, fees: Number.NaN, interestRate: Number.POSITIVE_INFINITY, termYears: 0 });
for (const value of [edge.taxablePrice, edge.salesTax, edge.amountFinanced, edge.monthlyPayment, edge.totalInterest, edge.totalCost]) assert.ok(Number.isFinite(value));
assert.equal(edge.amountFinanced, 0);
assert.equal(edge.monthlyPayment, 0);
console.log('Boat Loan formula tests passed');
