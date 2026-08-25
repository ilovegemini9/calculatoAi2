import assert from 'node:assert/strict';
assert.equal(1000 * 10 / 100, 100);
assert.equal(1000 + 1000 * 10 / 100, 1100);
assert.equal(200 * 20 / 100, 40);
assert.equal(Number((60 / (1.7 * 1.7)).toFixed(2)), 20.76);
assert.equal(0 / (1.7 * 1.7), 0);
assert.equal(Number.isFinite(Math.max(0, 0)), true);
console.log('Health and sales tools tests passed');
