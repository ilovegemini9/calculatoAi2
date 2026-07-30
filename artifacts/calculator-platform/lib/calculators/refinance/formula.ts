// Refinance Calculator
// Should you refinance? Break-even analysis, savings, and net benefit.

export interface RefinanceInput {
  currentLoanBalance: number;
  currentInterestRate: number; // annual %
  currentMonthlyPayment: number; // P&I only
  currentRemainingTermMonths: number; // months left on existing loan
  newInterestRate: number; // annual %
  newLoanTermYears: number;
  closingCostAmount: number; // total closing costs ($)
  rollClosingCosts: boolean; // add closing costs to new loan balance?
  projectionYears?: number; // default 30 — how many years to project savings
}

export interface RefinanceResult {
  // New loan
  newLoanBalance: number; // includes closing costs if rolled in
  newMonthlyPayment: number;

  // Monthly comparison
  monthlyPaymentChange: number; // positive = savings, negative = increase
  monthlySavings: number; // max(0, current - new)

  // Break-even
  breakEvenMonths: number | null; // null if no savings
  breakEvenYears: number | null;

  // Interest over life
  remainingInterestCurrent: number;
  totalInterestNew: number;
  lifetimeInterestSavings: number; // can be negative if extending term

  // Net benefit over projection period
  projectionYears: number;
  netBenefitOverProjection: number; // cumulative payment savings minus closing costs

  // APR context
  effectiveNewRate: number; // same as input for display

  // Warning flags
  termExtended: boolean; // true if new term > remaining current term
  rateIncrease: boolean; // true if new rate > current rate
}

export function calculateRefinance(input: RefinanceInput): RefinanceResult {
  const r = (v: number) => Math.round(v * 100) / 100;

  const newLoanBalance = input.rollClosingCosts
    ? input.currentLoanBalance + input.closingCostAmount
    : input.currentLoanBalance;

  const newMonthlyRate = input.newInterestRate / 100 / 12;
  const newPayments = input.newLoanTermYears * 12;

  const newMonthlyPayment =
    newLoanBalance === 0
      ? 0
      : newMonthlyRate === 0
        ? newLoanBalance / newPayments
        : (newLoanBalance * newMonthlyRate * Math.pow(1 + newMonthlyRate, newPayments)) /
          (Math.pow(1 + newMonthlyRate, newPayments) - 1);

  const monthlyPaymentChange = r(input.currentMonthlyPayment - newMonthlyPayment);
  const monthlySavings = r(Math.max(0, monthlyPaymentChange));

  // Break-even: months until cumulative savings cover closing costs (out-of-pocket)
  const outOfPocketClosing = input.rollClosingCosts ? 0 : input.closingCostAmount;
  const breakEvenMonths =
    monthlySavings > 0 ? Math.ceil(outOfPocketClosing / monthlySavings) : null;
  const breakEvenYears = breakEvenMonths !== null ? Math.round((breakEvenMonths / 12) * 10) / 10 : null;

  // Remaining interest on current loan
  const remainingInterestCurrent = r(
    input.currentMonthlyPayment * input.currentRemainingTermMonths - input.currentLoanBalance
  );

  // Total interest on new loan
  const totalInterestNew = r(Math.max(0, newMonthlyPayment * newPayments - newLoanBalance));

  // Lifetime interest savings (can be negative if extending term)
  const lifetimeInterestSavings = r(remainingInterestCurrent - totalInterestNew);

  // Net benefit over projection period
  const projectionYears = input.projectionYears ?? 30;
  const projectionMonths = Math.min(projectionYears * 12, Math.max(input.currentRemainingTermMonths, newPayments));
  const cumulativeSavings = monthlyPaymentChange * projectionMonths;
  const netBenefitOverProjection = r(cumulativeSavings - (input.rollClosingCosts ? 0 : input.closingCostAmount));

  return {
    newLoanBalance: r(newLoanBalance),
    newMonthlyPayment: r(newMonthlyPayment),
    monthlyPaymentChange,
    monthlySavings,
    breakEvenMonths,
    breakEvenYears,
    remainingInterestCurrent,
    totalInterestNew,
    lifetimeInterestSavings,
    projectionYears,
    netBenefitOverProjection,
    effectiveNewRate: input.newInterestRate,
    termExtended: newPayments > input.currentRemainingTermMonths,
    rateIncrease: input.newInterestRate > input.currentInterestRate,
  };
}
