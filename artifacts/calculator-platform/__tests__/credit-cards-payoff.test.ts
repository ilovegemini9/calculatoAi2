import assert from 'node:assert/strict';
import { calculateCreditCardsPayoff } from '../lib/calculators/debtProducts';

const result = calculateCreditCardsPayoff({
  card1: { balance: 12000, apr: 22.99, payment: 350 },
  card2: { balance: 5000, apr: 18.99, payment: 150 },
  card3: { balance: 2500, apr: 24.99, payment: 100 },
});
assert.equal(result.totalBalance, 19500);
assert.equal(result.totalPayment, 600);
assert.ok(result.payoffMonths > 0);
assert.ok(result.totalInterest > 0);
assert.equal(result.cards.length, 3);

const low = calculateCreditCardsPayoff({
  card1: { balance: 10000, apr: 30, payment: 50 },
  card2: { balance: 0, apr: 20, payment: 0 },
  card3: { balance: 0, apr: 20, payment: 0 },
});
assert.equal(low.cards[0].status, 'payment-too-low');
assert.equal(low.cards[0].payments, 0);
assert.equal(low.totalBalance, 10000);

const zero = calculateCreditCardsPayoff({
  card1: { balance: 0, apr: 20, payment: 0 },
  card2: { balance: 0, apr: 20, payment: 0 },
  card3: { balance: 0, apr: 20, payment: 0 },
});
assert.equal(zero.totalBalance, 0);
assert.equal(zero.payoffMonths, 0);
assert.equal(zero.totalInterest, 0);
console.log('Credit Cards Payoff calculator tests passed');
