import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBondYield, calculateBusinessValuation, calculateCarAffordability, calculateDscr } from '../lib/calculators/businessGaps';

test('business valuation bridges EBITDA to enterprise and equity value', () => {
  const result = calculateBusinessValuation(1_000_000, 20, 6, 100_000);
  assert.equal(result.ebitda, 200_000);
  assert.equal(result.enterpriseValue, 1_200_000);
  assert.equal(result.equityValue, 1_100_000);
  assert.equal(result.revenueMultiple, 1.2);
});

test('DSCR reports coverage and surplus', () => {
  const result = calculateDscr(120_000, 80_000);
  assert.equal(result.dscr, 1.5);
  assert.equal(result.annualSurplus, 40_000);
  assert.equal(result.maximumAnnualDebtService, 120_000);
});

test('DSCR guards against zero debt service', () => {
  const result = calculateDscr(120_000, 0);
  assert.match(result.error ?? '', /positive annual debt service/);
});

test('car affordability converts payment budget into a loan estimate', () => {
  const result = calculateCarAffordability(7_000, 500, 10_000, 20, 7, 60);
  assert.equal(result.maximumMonthlyPayment, 900);
  assert.ok(result.supportedLoanAmount > 45_000);
  assert.equal(result.estimatedVehiclePrice, result.supportedLoanAmount + 10_000);
  assert.ok(result.totalInterest > 0);
});

test('bond yield reports coupon, current yield, and approximate YTM', () => {
  const result = calculateBondYield(1_000, 4, 980, 4);
  assert.equal(result.annualCoupon, 40);
  assert.equal(result.premiumOrDiscount, -20);
  assert.ok(result.currentYieldPercent > 4);
  assert.ok(result.approximateYtmPercent > result.currentYieldPercent);
});
