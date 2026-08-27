import assert from 'node:assert/strict';
import { fraction, quadratic, ratio, scientific, standardDeviation } from '../lib/calculators/mathCore';

assert.equal(scientific(2).square, 4);
assert.ok(Math.abs(scientific(0).cos - 1) < 1e-12);
assert.equal(scientific(0).ln, Number.NaN);
assert.equal(scientific(-2).ln, Number.NaN);
assert.deepEqual(fraction(1, 2, 1, 6).reducedNumerator, 2);
assert.equal(fraction(1, 2, 1, 6).reducedDenominator, 3);
assert.equal(ratio(10, 20).simplifiedFirst, 1);
assert.equal(ratio(10, 20).simplifiedSecond, 2);
assert.ok(Number.isNaN(ratio(1, 0).ratio));
assert.equal(standardDeviation([1, 2, 3, 4]).mean, 2.5);
assert.ok(Math.abs(standardDeviation([1, 2, 3, 4]).standardDeviation - 1.11803398875) < 1e-9);
assert.deepEqual(quadratic(1, -3, 2).roots.sort(), [1, 2]);
assert.equal(quadratic(1, 0, 1).roots.length, 0);
assert.ok(Number.isFinite(scientific(NaN).square));
assert.ok(Number.isFinite(standardDeviation([]).standardDeviation));
console.log('Math core production tests passed');
