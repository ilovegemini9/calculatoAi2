export type RandomSort = 'none' | 'ascending' | 'descending';

export interface RandomNumberOptions {
  minimum: number;
  maximum: number;
  count: number;
  seed?: number;
  allowDuplicates?: boolean;
  sort?: RandomSort;
}

export interface RandomNumberResult {
  values: number[];
  minimum: number;
  maximum: number;
  count: number;
  seeded: boolean;
  error?: string;
}

function finite(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function integer(value: number, fallback: number) {
  return Math.trunc(finite(value, fallback));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function seededUnit(seed: number) {
  let state = Math.abs(integer(seed, 1)) % 2147483647;
  if (state === 0) state = 1;
  return () => {
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function randomIntegers(options: RandomNumberOptions, randomUnit = Math.random): RandomNumberResult {
  const minimum = integer(options.minimum, 0);
  const maximum = integer(options.maximum, 100);
  const low = Math.min(minimum, maximum);
  const high = Math.max(minimum, maximum);
  const count = clamp(integer(options.count, 1), 1, 100);
  const allowDuplicates = options.allowDuplicates ?? true;
  const sort = options.sort ?? 'none';
  const rangeSize = high - low + 1;
  if (!allowDuplicates && count > rangeSize) {
    return { values: [], minimum: low, maximum: high, count, seeded: options.seed !== undefined, error: 'Count cannot exceed the number of unique integers in the selected range.' };
  }
  const unit = options.seed === undefined ? randomUnit : seededUnit(options.seed);
  const values: number[] = [];
  const seen = new Set<number>();
  let attempts = 0;
  while (values.length < count && attempts < count * 20) {
    attempts += 1;
    const candidate = low + Math.floor(clamp(unit(), 0, 0.999999999999) * rangeSize);
    if (!allowDuplicates && seen.has(candidate)) {
      if (attempts < count * 20) continue;
      const fallback = Array.from({ length: rangeSize }, (_, index) => low + index).find((value) => !seen.has(value));
      if (fallback === undefined) break;
      seen.add(fallback);
      values.push(fallback);
      continue;
    }
    seen.add(candidate);
    values.push(candidate);
  }
  if (sort === 'ascending') values.sort((a, b) => a - b);
  if (sort === 'descending') values.sort((a, b) => b - a);
  return { values, minimum: low, maximum: high, count, seeded: options.seed !== undefined };
}

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  excludeBrackets: boolean;
  noRepeats: boolean;
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
const AMBIGUOUS = new Set('iIl1L|o0O`\'-_":;.,'.split(''));
const BRACKETS = new Set('<>()[]{}'.split(''));

export function passwordPool(options: PasswordOptions) {
  let pool = '';
  if (options.lowercase) pool += LOWERCASE;
  if (options.uppercase) pool += UPPERCASE;
  if (options.numbers) pool += NUMBERS;
  if (options.symbols) pool += SYMBOLS;
  if (options.excludeAmbiguous) pool = [...pool].filter((character) => !AMBIGUOUS.has(character)).join('');
  if (options.excludeBrackets) pool = [...pool].filter((character) => !BRACKETS.has(character)).join('');
  return [...new Set(pool)].join('');
}

export function passwordEntropy(length: number, poolSize: number) {
  const safeLength = Math.max(0, integer(length, 0));
  return poolSize > 1 ? safeLength * Math.log2(poolSize) : 0;
}

export function generatePassword(options: PasswordOptions, randomUnit = Math.random): { password: string; poolSize: number; entropyBits: number; error?: string } {
  const length = clamp(integer(options.length, 16), 4, 128);
  const pool = passwordPool(options);
  if (!pool) return { password: '', poolSize: 0, entropyBits: 0, error: 'Select at least one character group.' };
  if (options.noRepeats && length > pool.length) return { password: '', poolSize: pool.length, entropyBits: passwordEntropy(length, pool.length), error: 'The selected length exceeds the available non-repeating characters.' };
  const characters: string[] = [];
  const available = [...pool];
  while (characters.length < length && available.length > 0) {
    const index = Math.floor(clamp(randomUnit(), 0, 0.999999999999) * available.length);
    const [character] = available.splice(index, 1);
    characters.push(character);
    if (!options.noRepeats) available.push(...pool);
  }
  return { password: characters.join(''), poolSize: pool.length, entropyBits: passwordEntropy(length, pool.length) };
}

export function secureRandomUnit() {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] / 4294967296;
  }
  return Math.random();
}

export function rollDice(count: number, sides: number, randomUnit = secureRandomUnit) {
  const safeCount = clamp(integer(count, 1), 1, 100);
  const safeSides = clamp(integer(sides, 6), 2, 1000);
  const rolls = Array.from({ length: safeCount }, () => 1 + Math.floor(clamp(randomUnit(), 0, 0.999999999999) * safeSides));
  return { rolls, total: rolls.reduce((sum, value) => sum + value, 0), count: safeCount, sides: safeSides };
}

export type ShoeAgeGroup = 'adult' | 'child' | 'toddler';

export interface ShoeConversion {
  footLengthCm: number;
  usWomen: number;
  usMen: number;
  ukIndia: number;
  eu: number;
  japanMexico: number;
  china: number;
}

function halfStep(value: number) {
  return Math.round(value * 2) / 2;
}

export function shoeSizes(footLength: number, unit: 'cm' | 'mm' | 'in', ageGroup: ShoeAgeGroup = 'adult'): ShoeConversion | { error: string } {
  const raw = finite(footLength, 0);
  const footLengthCm = unit === 'mm' ? raw / 10 : unit === 'in' ? raw * 2.54 : raw;
  if (footLengthCm <= 0 || footLengthCm > 45) return { error: 'Enter a foot length between 0 and 45 centimeters.' };
  const inches = footLengthCm / 2.54;
  const usWomenFormula = ageGroup === 'adult' ? 3 * inches - 21 : ageGroup === 'child' ? 3 * inches - 9.75 : 3 * inches - 9.75;
  const usMenFormula = ageGroup === 'adult' ? 3 * inches - 22 : ageGroup === 'child' ? 3 * inches - 22.75 : 3 * inches - 10.75;
  const ukFormula = ageGroup === 'adult' ? 3 * inches - 23 : ageGroup === 'child' ? 3 * inches - 23.75 : 3 * inches - 10.75;
  return {
    footLengthCm,
    usWomen: halfStep(usWomenFormula),
    usMen: halfStep(usMenFormula),
    ukIndia: halfStep(ukFormula),
    eu: Math.round(1.5 * footLengthCm + 2),
    japanMexico: halfStep(footLengthCm),
    china: Math.round(2 * footLengthCm - 10),
  };
}
