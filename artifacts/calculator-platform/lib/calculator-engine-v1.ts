export type NumericInput = number | null | undefined;

export type SolveResult = {
  value: number | null;
  error?: string;
};

const finite = (value: number): SolveResult =>
  Number.isFinite(value) ? { value } : { value: null, error: 'Result is not finite.' };

export function percentageOf(percent: NumericInput, whole: NumericInput): SolveResult {
  if (percent == null || whole == null) return { value: null, error: 'Enter percent and whole.' };
  return finite((percent / 100) * whole);
}

export function percentageFromPart(part: NumericInput, whole: NumericInput): SolveResult {
  if (part == null || whole == null) return { value: null, error: 'Enter part and whole.' };
  if (whole === 0) return { value: null, error: 'Whole cannot be zero.' };
  return finite((part / whole) * 100);
}

export function solveWholeFromPartPercent(part: NumericInput, percent: NumericInput): SolveResult {
  if (part == null || percent == null) return { value: null, error: 'Enter part and percent.' };
  if (percent === 0) return { value: null, error: 'Percent cannot be zero.' };
  return finite(part / (percent / 100));
}

export function percentageChange(oldValue: NumericInput, newValue: NumericInput): SolveResult {
  if (oldValue == null || newValue == null) return { value: null, error: 'Enter both values.' };
  if (oldValue === 0) return { value: null, error: 'Starting value cannot be zero.' };
  return finite(((newValue - oldValue) / Math.abs(oldValue)) * 100);
}

export function discount(price: NumericInput, percent: NumericInput): SolveResult {
  if (price == null || percent == null) return { value: null, error: 'Enter price and discount.' };
  return finite(price * (1 - percent / 100));
}

export function average(values: number[]): SolveResult {
  if (!values.length || values.some((v) => !Number.isFinite(v))) return { value: null, error: 'Enter at least one finite value.' };
  return finite(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function squareRoot(value: NumericInput): SolveResult {
  if (value == null) return { value: null, error: 'Enter a number.' };
  if (value < 0) return { value: null, error: 'Real square root requires a non-negative number.' };
  return finite(Math.sqrt(value));
}

export function power(base: NumericInput, exponent: NumericInput): SolveResult {
  if (base == null || exponent == null) return { value: null, error: 'Enter base and exponent.' };
  return finite(Math.pow(base, exponent));
}
