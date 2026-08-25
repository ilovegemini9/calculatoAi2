import assert from 'node:assert/strict';
import { calculateCollegeCost } from '../lib/calculators/loanProducts';

const projected = calculateCollegeCost({ annualCost: 30000, inflationRate: 4, yearsUntilCollege: 10, currentSavings: 10000, annualContribution: 6000, contributionGrowthRate: 3 });
const expectedAnnual = 30000 * Math.pow(1.04, 10);
assert.ok(Math.abs(projected.futureAnnualCost - expectedAnnual) < 0.01);
assert.equal(projected.totalFutureCost, Math.round(expectedAnnual * 4 * 100) / 100);
assert.ok(projected.futureSavings > 10000);
assert.ok(projected.fundingGap >= 0);

const now = calculateCollegeCost({ annualCost: 10000, inflationRate: 5, yearsUntilCollege: 0, currentSavings: 0, annualContribution: 0, contributionGrowthRate: 3 });
assert.equal(now.futureAnnualCost, 10000);
assert.equal(now.totalFutureCost, 40000);
assert.equal(now.futureSavings, 0);
assert.equal(now.fundingGap, 40000);

const edge = calculateCollegeCost({ annualCost: -10, inflationRate: Number.NaN, yearsUntilCollege: -2, currentSavings: Number.POSITIVE_INFINITY, annualContribution: -5, contributionGrowthRate: Number.NaN });
for (const value of [edge.futureAnnualCost, edge.totalFutureCost, edge.futureSavings, edge.fundingGap, edge.savingsGrowth]) assert.ok(Number.isFinite(value));
console.log('College Cost calculator tests passed');
