import assert from 'node:assert/strict';
import { generatePassword, passwordEntropy, passwordPool, randomIntegers, rollDice, shoeSizes } from '../lib/calculators/utilityExtras';

const seededOptions = { minimum: 1, maximum: 3, count: 3, seed: 42, allowDuplicates: false as const, sort: 'ascending' as const };
const seededFirst = randomIntegers(seededOptions);
const seededSecond = randomIntegers(seededOptions);
assert.deepEqual(seededFirst.values, seededSecond.values);
assert.deepEqual(seededFirst.values, [1, 2, 3]);
assert.equal(seededFirst.values.every((value) => value >= 1 && value <= 3), true);

const impossible = randomIntegers({ minimum: 1, maximum: 2, count: 3, allowDuplicates: false });
assert.deepEqual(impossible.values, []);
assert.match(impossible.error ?? '', /unique integers/);

const passwordOptions = { length: 12, lowercase: true, uppercase: true, numbers: true, symbols: false, excludeAmbiguous: true, excludeBrackets: false, noRepeats: false };
const pool = passwordPool(passwordOptions);
assert.equal(pool.includes('I'), false);
assert.equal(pool.includes('0'), false);
assert.equal(generatePassword(passwordOptions, () => 0).password.length, 12);
assert.equal(passwordEntropy(12, pool.length) > 0, true);

const dice = rollDice(3, 6, () => 0.999999);
assert.deepEqual(dice.rolls, [6, 6, 6]);
assert.equal(dice.total, 18);
assert.equal(dice.count, 3);
assert.equal(dice.sides, 6);

const shoe = shoeSizes(25, 'cm', 'adult');
assert.equal('error' in shoe, false);
if (!('error' in shoe)) {
  assert.equal(shoe.eu, 40);
  assert.equal(shoe.usWomen, 8.5);
  assert.equal(shoe.usMen, 7.5);
  assert.equal(shoe.ukIndia, 6.5);
  assert.equal(shoe.japanMexico, 25);
  assert.equal(shoe.china, 40);
}

console.log('Reference-inspired utility production tests passed');
