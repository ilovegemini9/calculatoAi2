import assert from 'node:assert/strict';
import { combination, factorial, percentile } from '../lib/calculators/omniMathWave';

assert.equal(factorial(0), 1);
assert.equal(factorial(5), 120);
assert.equal(factorial(-1), 0);
assert.equal(combination(10, 3), 120);
assert.equal(combination(10, 0), 1);
assert.equal(combination(3, 4), 0);
assert.equal(percentile([1, 2, 3, 4], 50), 2.5);
assert.equal(percentile([10, 20, 30], 0), 10);
assert.equal(percentile([10, 20, 30], 100), 30);
for (const value of [factorial(Number.NaN), combination(Number.POSITIVE_INFINITY, 2), percentile([], 50)]) {
  assert.ok(Number.isFinite(value));
}
console.log('Omni math wave production tests passed');
