// Home Equity Loan (fixed-rate, fully amortizing second mortgage)
// Max CLTV (Combined Loan-to-Value) typically 85% with most lenders

export interface HomeEquityLoanInput {
  currentHomeValue: number;
  currentMortgageBalance: number;
  loanAmount: number; // desired equity loan amount
  interestRate: number; // annual %
  loanTermYears: number;
  maxCltvPct?: number; // default 85
}

export interface HomeEquityLoanResult {
  // Equity position
  currentEquity: number;
  maxCltvPct: number;
  maxCombinedDebt: number;
  maxLoanAvailable: number;
  cltv: number; // % after new loan

  // Loan
  loanAmount: number; // capped at maxLoanAvailable
  isOverLimit: boolean;

  // Payments
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;

  // Context
  effectiveRate: number; // same as input, shown for display
}

export function calculateHomeEquityLoan(input: HomeEquityLoanInput): HomeEquityLoanResult {
  const maxCltvPct = input.maxCltvPct ?? 85;
  const currentEquity = Math.max(0, input.currentHomeValue - input.currentMortgageBalance);
  const maxCombinedDebt = input.currentHomeValue * (maxCltvPct / 100);
  const maxLoanAvailable = Math.max(0, maxCombinedDebt - input.currentMortgageBalance);

  const loanAmount = Math.min(input.loanAmount, maxLoanAvailable);
  const isOverLimit = input.loanAmount > maxLoanAvailable;

  const cltv =
    input.currentHomeValue > 0
      ? ((input.currentMortgageBalance + loanAmount) / input.currentHomeValue) * 100
      : 0;

  // Monthly payment
  const monthlyRate = input.interestRate / 100 / 12;
  const n = input.loanTermYears * 12;
  const monthlyPayment =
    loanAmount === 0
      ? 0
      : monthlyRate === 0
        ? loanAmount / n
        : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) /
          (Math.pow(1 + monthlyRate, n) - 1);

  const totalCost = monthlyPayment * n;
  const totalInterest = totalCost - loanAmount;

  const r = (v: number) => Math.round(v * 100) / 100;

  return {
    currentEquity: r(currentEquity),
    maxCltvPct,
    maxCombinedDebt: r(maxCombinedDebt),
    maxLoanAvailable: r(maxLoanAvailable),
    cltv: Math.round(cltv * 100) / 100,
    loanAmount: r(loanAmount),
    isOverLimit,
    monthlyPayment: r(monthlyPayment),
    totalInterest: r(totalInterest),
    totalCost: r(totalCost),
    effectiveRate: input.interestRate,
  };
}
