import assert from 'node:assert/strict';
import { creditUtilization, comparePayoffStrategy } from '../lib/calculators/creditAdvanced';
const u=creditUtilization(2500,10000);assert.equal(u.ratio,25);assert.equal(u.available,7500);assert.equal(creditUtilization(100,0).ratio,0);
const lines=[{balance:5000,apr:10,payment:150},{balance:1000,apr:25,payment:100}];
assert.equal(comparePayoffStrategy(lines,'snowball').order[0].balance,1000);
assert.equal(comparePayoffStrategy(lines,'avalanche').order[0].apr,25);
for(const s of ['snowball','avalanche'] as const){const r=comparePayoffStrategy(lines,s);assert.ok(Number.isFinite(r.totalBalance));assert.ok(r.estimatedMonths>0)}
console.log('Credit advanced production tests passed');
