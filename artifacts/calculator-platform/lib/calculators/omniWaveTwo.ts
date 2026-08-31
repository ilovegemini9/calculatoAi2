type PressureUnit = 'bar' | 'psi' | 'atm' | 'pascal';

const pascalsPerUnit: Record<PressureUnit, number> = { bar: 100000, psi: 6894.757293168, atm: 101325, pascal: 1 };

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function pressureConvert(value: number, unit: PressureUnit) {
  const pascals = finite(value) * pascalsPerUnit[unit];
  return {
    bar: pascals / pascalsPerUnit.bar,
    psi: pascals / pascalsPerUnit.psi,
    atm: pascals / pascalsPerUnit.atm,
    pascal: pascals,
  };
}

export function salaryToHourly(annualSalary: number, hoursPerWeek: number, weeksPerYear = 52) {
  const annual = Math.max(0, finite(annualSalary));
  const weeks = Math.max(1, finite(weeksPerYear));
  const hours = Math.max(0, finite(hoursPerWeek));
  const hourly = hours > 0 ? annual / (weeks * hours) : 0;
  return { hourly, weekly: hourly * hours, monthly: annual / 12, annual };
}

export function discountRate(presentValue: number, futureValue: number, periods: number, compoundingFrequency = 1): number {
  const pv = finite(presentValue);
  const fv = finite(futureValue);
  const exponent = Math.max(0, finite(periods)) * Math.max(1, finite(compoundingFrequency));
  if (pv <= 0 || fv < 0 || exponent <= 0) return 0;
  return Math.pow(fv / pv, 1 / exponent) - 1;
}

export function linearCombination(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number) {
  const values = [a1, b1, c1, a2, b2, c2].map(finite);
  const [x1, y1, z1, x2, y2, z2] = values;
  const determinant = x1 * y2 - x2 * y1;
  if (Math.abs(determinant) > 1e-12) {
    return { kind: 'unique' as const, x: (z1 * y2 - z2 * y1) / determinant, y: (x1 * z2 - x2 * z1) / determinant };
  }
  const consistent = Math.abs(x1 * z2 - x2 * z1) < 1e-12 && Math.abs(y1 * z2 - y2 * z1) < 1e-12;
  return { kind: consistent ? 'infinite' as const : 'none' as const, x: 0, y: 0 };
}
