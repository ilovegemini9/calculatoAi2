function nn(v: number) { return Number.isFinite(v) ? v : 0 }

export function scientific(value: number) {
  const x = nn(value)
  return {
    sin: Math.sin(x),
    cos: Math.cos(x),
    // ln(x) is undefined for x <= 0. Keep NaN so the UI can render an
    // explicit undefined state instead of presenting a mathematically valid-looking zero.
    ln: x > 0 ? Math.log(x) : Number.NaN,
    square: x * x,
  }
}

export function fraction(a: number, b: number, c: number, d: number) {
  const den = nn(b) * nn(d)
  const num = nn(a) * nn(d) + nn(c) * nn(b)
  const g = (x: number, y: number): number => y ? g(y, x % y) : Math.abs(x)
  const div = g(num, den)
  return {
    numerator: num,
    denominator: den,
    reducedNumerator: div ? num / div : 0,
    reducedDenominator: div ? den / div : 0,
  }
}

export function standardDeviation(values: number[]) {
  const v = values.filter(Number.isFinite)
  if (!v.length) return { mean: 0, standardDeviation: 0 }
  const mean = v.reduce((s, x) => s + x, 0) / v.length
  return {
    mean,
    standardDeviation: Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / v.length),
  }
}

export function ratio(a: number, b: number) {
  const x = Math.abs(nn(a)), y = Math.abs(nn(b))
  const g = (m: number, n: number): number => n ? g(n, m % n) : m
  const d = g(x, y)
  return {
    ratio: y === 0 ? Number.NaN : x / y,
    first: x,
    second: y,
    simplifiedFirst: d ? x / d : 0,
    simplifiedSecond: d ? y / d : 0,
  }
}

export function quadratic(a: number, b: number, c: number) {
  const A = nn(a), B = nn(b), C = nn(c), disc = B * B - 4 * A * C
  return {
    discriminant: disc,
    roots: A === 0 ? [] : disc < 0 ? [] : [(-B + Math.sqrt(disc)) / (2 * A), (-B - Math.sqrt(disc)) / (2 * A)],
  }
}
