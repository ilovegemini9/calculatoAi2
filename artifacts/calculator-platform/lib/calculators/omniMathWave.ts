function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function factorial(value: number): number {
  const n = Math.floor(finite(value));
  if (n < 0 || n > 170) return 0;
  let result = 1;
  for (let i = 2; i <= n; i += 1) result *= i;
  return result;
}

export function combination(nValue: number, rValue: number): number {
  const n = Math.floor(finite(nValue));
  const r = Math.floor(finite(rValue));
  if (n < 0 || r < 0 || r > n || n > 170) return 0;
  const k = Math.min(r, n - r);
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
  return result;
}

export function averageRating(counts: number[]): number {
  const safe = counts.slice(0, 5).map((value) => Math.max(0, finite(value)));
  const total = safe.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;
  return safe.reduce((sum, count, index) => sum + count * (index + 1), 0) / total;
}

export function leastToGreatest(values: number[]): number[] {
  return values.filter(Number.isFinite).sort((a, b) => a - b);
}

export function percentileRank(value: number, values: number[]): number {
  const sorted = leastToGreatest(values);
  if (!sorted.length) return 0;
  const rank = sorted.filter((item) => item <= finite(value)).length / sorted.length;
  return rank * 100;
}

export function percentile(values: number[], percentileValue: number): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const p = Math.min(100, Math.max(0, finite(percentileValue))) / 100;
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const fraction = position - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}
