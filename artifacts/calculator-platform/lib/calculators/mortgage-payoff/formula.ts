// Mortgage Payoff Calculator
// How extra payments accelerate payoff and reduce total interest

export interface MortgagePayoffInput {
  loanBalance: number; // current remaining balance
  interestRate: number; // annual %
  monthlyPayment: number; // current regular P&I payment
  extraMonthlyPayment: number; // additional amount each month
  lumpSumPayment?: number; // one-time extra payment today
}

export interface PayoffResult {
  // Without extra payments
  baseMonthsRemaining: number;
  baseTotalInterest: number;

  // With extra payments
  newMonthsRemaining: number;
  newTotalInterest: number;

  // Savings
  monthsSaved: number;
  yearsSaved: number;
  interestSaved: number;

  // Monthly context
  newTotalMonthlyPayment: number; // regular + extra

  // Payoff dates
  basePayoffDate: string; // YYYY-MM
  newPayoffDate: string; // YYYY-MM
}

function amortize(
  balance: number,
  monthlyRate: number,
  payment: number,
  lumpSum: number,
): { months: number; totalInterest: number } {
  let b = Math.max(0, balance - lumpSum);
  let totalInterest = 0;
  let months = 0;
  const MAX_MONTHS = 600; // 50 years guard

  while (b > 0.005 && months < MAX_MONTHS) {
    const interestCharge = b * monthlyRate;
    const principalPayment = Math.min(payment - interestCharge, b);
    if (principalPayment <= 0) {
      // Payment doesn't cover interest — can't pay off
      return { months: MAX_MONTHS, totalInterest: Infinity };
    }
    totalInterest += interestCharge;
    b -= principalPayment;
    if (b < 0) b = 0;
    months++;
  }

  return {
    months,
    totalInterest: Math.round(totalInterest * 100) / 100,
  };
}

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 7);
}

export function calculateMortgagePayoff(input: MortgagePayoffInput): PayoffResult {
  const monthlyRate = input.interestRate / 100 / 12;
  const lumpSum = input.lumpSumPayment ?? 0;

  // Base scenario (no extra)
  const base = amortize(input.loanBalance, monthlyRate, input.monthlyPayment, 0);

  // Extra payment scenario
  const totalPayment = input.monthlyPayment + input.extraMonthlyPayment;
  const extra = amortize(input.loanBalance, monthlyRate, totalPayment, lumpSum);

  const monthsSaved = Math.max(0, base.months - extra.months);
  const interestSaved = Math.max(0, base.totalInterest - extra.totalInterest);

  return {
    baseMonthsRemaining: base.months,
    baseTotalInterest: base.totalInterest,
    newMonthsRemaining: extra.months,
    newTotalInterest: extra.totalInterest,
    monthsSaved,
    yearsSaved: Math.round((monthsSaved / 12) * 10) / 10,
    interestSaved: Math.round(interestSaved * 100) / 100,
    newTotalMonthlyPayment: Math.round((input.monthlyPayment + input.extraMonthlyPayment) * 100) / 100,
    basePayoffDate: addMonths(base.months),
    newPayoffDate: addMonths(extra.months),
  };
}
