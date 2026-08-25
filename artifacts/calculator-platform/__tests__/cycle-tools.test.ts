import assert from 'node:assert/strict';
import { addDays, estimateCycleDate } from '../lib/calculators/cycleProducts';
assert.equal(addDays('2026-01-01', 280), '2026-10-08');
assert.equal(estimateCycleDate('2026-01-01', 28, 'due-date'), '2026-10-08');
assert.equal(estimateCycleDate('2026-01-01', 32, 'due-date'), '2026-10-12');
assert.equal(estimateCycleDate('2026-01-01', 28, 'ovulation'), '2026-01-15');
assert.equal(estimateCycleDate('2026-01-01', 28, 'period'), '2026-01-29');
assert.equal(addDays('invalid', 2), 'Invalid date');
console.log('Cycle tools production tests passed');
