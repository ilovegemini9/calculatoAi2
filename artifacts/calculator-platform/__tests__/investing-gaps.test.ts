import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBreakEven, calculateCapitalGains, calculateDcf, calculateDividend } from '../lib/calculators/investingGaps';

test('break-even uses contribution margin and reports whole economics', () => {
  const result = calculateBreakEven(50_000, 100, 40);
  assert.equal(result.error, undefined);
  assert.equal(result.contributionMargin, 60);
  assert.equal(result.breakEvenUnits, 50_000 / 60);
  assert.equal(result.breakEvenRevenue, (50_000 / 60) * 100);
});

test('break-even rejects non-positive contribution margin', () => {
  const result = calculateBreakEven(50_000, 40, 40);
  assert.match(result.error ?? '', /greater than variable cost/);
});

test('DCF returns a finite value when discount exceeds terminal growth', () => {
  const result = calculateDcf(100_000, 5, 10, 2, 5);
  assert.equal(result.error, undefined);
  assert.ok(result.enterpriseValue > result.presentValueForecast);
  assert.ok(result.presentValueTerminal > 0);
});

test('DCF rejects an invalid terminal growth assumption', () => {
  const result = calculateDcf(100_000, 5, 8, 8, 5);
  assert.match(result.error ?? '', /greater than terminal growth/);
});

test('capital gains applies basis, selling costs, and tax rate', () => {
  const result = calculateCapitalGains(200_000, 300_000, 5_000, 25_000, 20);
  assert.equal(result.adjustedBasis, 225_000);
  assert.equal(result.netSaleProceeds, 295_000);
  assert.equal(result.realizedGain, 70_000);
  assert.equal(result.estimatedTax, 14_000);
  assert.equal(result.afterTaxProceeds, 281_000);
});

test('capital gains does not estimate tax on a modeled loss', () => {
  const result = calculateCapitalGains(200_000, 180_000, 5_000, 0, 30);
  assert.equal(result.realizedGain, -25_000);
  assert.equal(result.taxableGain, 0);
  assert.equal(result.estimatedTax, 0);
});

test('dividend reports income and indicated yield', () => {
  const result = calculateDividend(100, 2.4, 60);
  assert.equal(result.annualIncome, 240);
  assert.equal(result.monthlyIncome, 20);
  assert.equal(result.quarterlyIncome, 60);
  assert.equal(result.portfolioValue, 6_000);
  assert.equal(result.dividendYieldPercent, 4);
});
