import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateLoan } from '../lib/calculators/loan/formula';

function closeTo(actual: number, expected: number, digits = 1) {
  const margin = 0.5 * Math.pow(10, -digits);
  assert.ok(
    Math.abs(actual - expected) <= margin,
    `Expected ${actual} to be close to ${expected} (±${margin})`
  );
}

describe('calculateLoan — 0% interest', () => {
  const r = calculateLoan({ loanAmount: 12000, interestRate: 0, term: 1, termUnit: 'years' });

  it('payment = principal / months = 1000', () => assert.strictEqual(r.monthlyPayment, 1000));
  it('totalInterest = 0', () => assert.strictEqual(r.totalInterest, 0));
  it('totalCost = 12000', () => assert.strictEqual(r.totalCost, 12000));
  it('generates 12 amortization rows', () => assert.strictEqual(r.amortization.length, 12));
  it('final balance = 0', () => assert.strictEqual(r.amortization[11].balance, 0));
});

describe('calculateLoan — $10k at 12% APR over 36 months', () => {
  // r=0.01, n=36, (1.01)^36=1.43076878 → payment ≈ $332.14
  const r = calculateLoan({ loanAmount: 10000, interestRate: 12, term: 36, termUnit: 'months' });

  it('monthly payment ≈ $332.14', () => closeTo(r.monthlyPayment, 332.14, 1));
  it('totalPrincipal = 10000', () => assert.strictEqual(r.totalPrincipal, 10000));
  it('totalCost ≈ totalPrincipal + totalInterest', () => closeTo(r.totalCost, r.totalPrincipal + r.totalInterest, 0));
  it('totalInterest > 0', () => assert.ok(r.totalInterest > 0));
  it('generates 36 amortization rows', () => assert.strictEqual(r.amortization.length, 36));
  it('payment numbers are sequential 1…36', () => {
    r.amortization.forEach((row, i) => assert.strictEqual(row.paymentNumber, i + 1));
  });
  it('early interest > late interest', () => {
    assert.ok(r.amortization[0].interestPaid > r.amortization[35].interestPaid);
  });
  it('balance decreases monotonically', () => {
    for (let i = 1; i < r.amortization.length; i++) {
      assert.ok(r.amortization[i].balance <= r.amortization[i - 1].balance);
    }
  });
  it('final balance = 0', () => assert.strictEqual(r.amortization[35].balance, 0));
});

describe('calculateLoan — term unit equivalence', () => {
  it('3 years equals 36 months', () => {
    const byYears  = calculateLoan({ loanAmount: 5000, interestRate: 6, term: 3,  termUnit: 'years'  });
    const byMonths = calculateLoan({ loanAmount: 5000, interestRate: 6, term: 36, termUnit: 'months' });
    assert.strictEqual(byYears.monthlyPayment, byMonths.monthlyPayment);
    assert.strictEqual(byYears.totalInterest,  byMonths.totalInterest);
  });
});

describe('calculateLoan — rate sensitivity', () => {
  it('higher rate → higher total interest', () => {
    const low  = calculateLoan({ loanAmount: 20000, interestRate: 5,  term: 5, termUnit: 'years' });
    const high = calculateLoan({ loanAmount: 20000, interestRate: 15, term: 5, termUnit: 'years' });
    assert.ok(high.totalInterest > low.totalInterest);
  });
});

describe('calculateLoan — rounding', () => {
  it('balance values are rounded to cents', () => {
    const r = calculateLoan({ loanAmount: 7777, interestRate: 7.5, term: 24, termUnit: 'months' });
    r.amortization.forEach((row) => {
      const fractionalCents = (row.balance * 100) % 1;
      assert.ok(fractionalCents < 1e-9 || fractionalCents > 1 - 1e-9);
    });
  });
});
