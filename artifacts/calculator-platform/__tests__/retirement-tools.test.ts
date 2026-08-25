import assert from 'node:assert/strict';
import { project401k, projectInvestment, projectIra, projectRetirement, projectRothIra } from '../lib/calculators/retirementProducts';

const investment = projectInvestment(10000, 500, 7, 20, 12);
assert.equal(investment.principal, 10000);
assert.ok(investment.total > investment.principal);
assert.ok(investment.contributions > 0);
assert.equal(investment.periods, 240);

const retirement = projectRetirement(10000, 500, 100, 7, 20);
assert.ok(retirement.total > investment.total);
assert.equal(retirement.monthlyContribution, 500);
assert.equal(retirement.employerContribution, 100);

const fourOhOneK = project401k(10000, 500, 3, 7, 20);
assert.ok(fourOhOneK.contributions > investment.contributions);

const roth = projectRothIra(10000, 500, 0, 20);
assert.equal(roth.growth, 0);
assert.equal(roth.total, 130000);
const ira = projectIra(10000, 0, 7, 0);
assert.equal(ira.total, 10000);

for (const value of [projectInvestment(-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NaN, 0).total, project401k(0, 0, Number.NaN, 0, 0).total]) assert.ok(Number.isFinite(value));
console.log('Retirement and investment tools tests passed');
