import assert from 'node:assert/strict';
import { calculateRepayment } from '../lib/calculators/loanProducts';

const normal = calculateRepayment({ balance: 20000, annualRate: 6.5, monthlyPayment: 500 });
assert.equal(normal.status, 'payable');
assert.ok(normal.payments > 0 && normal.payments < 1200);
assert.equal(normal.amortization.at(-1)?.balance, 0);
assert.ok(normal.totalInterest > 0);
assert.ok(Number.isFinite(normal.totalPayments));

const tooLow = calculateRepayment({ balance: 10000, annualRate: 12, monthlyPayment: 50 });
assert.equal(tooLow.status, 'payment-too-low');
assert.equal(tooLow.payments, 0);
assert.equal(tooLow.amortization.length, 0);

const zeroRate = calculateRepayment({ balance: 1200, annualRate: 0, monthlyPayment: 100 });
assert.equal(zeroRate.status, 'payable');
assert.equal(zeroRate.payments, 12);
assert.equal(zeroRate.totalInterest, 0);
assert.equal(zeroRate.totalPayments, 1200);

const noBalance = calculateRepayment({ balance: 0, annualRate: 8, monthlyPayment: 0 });
assert.equal(noBalance.status, 'no-balance');
assert.equal(noBalance.payments, 0);

console.log('Repayment calculator tests passed');
