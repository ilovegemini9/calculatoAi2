// HELOC (Home Equity Line of Credit) Calculator
// Revolving credit line secured by home equity; two-phase: draw + repayment

export interface HelocInput {
  currentHomeValue: number;
  currentMortgageBalance: number;
  creditLimitRequested: number; // desired HELOC limit
  interestRate: number; // annual %, variable in practice, treated as fixed for projection
  drawPeriodYears: number; // typically 5–10
  repaymentPeriodYears: number; // typically 10–20
  monthlyDraw: number; // average monthly amount drawn during draw period
  maxCltvPct?: number; // default 85
}

export interface HelocResult {
  // Eligibility
  currentEquity: number;
  maxCombinedDebt: number;
  maxCreditLine: number;
  approvedCreditLine: number; // min(requested, max)
  isOverLimit: boolean;
  ltv: number; // current first-mortgage LTV %
  cltv: number; // combined LTV after HELOC %

  // Draw period (interest-only on drawn balance)
  projectedDrawBalance: number; // balance at end of draw period
  drawPeriodMonthlyInterest: number; // interest on avg drawn balance

  // Repayment period
  repaymentMonthlyPayment: number; // P&I on balance at end of draw
  totalInterestDraw: number;
  totalInterestRepayment: number;
  totalInterest: number;
  totalCost: number; // total interest + principal drawn
}

export function calculateHeloc(input: HelocInput): HelocResult {
  const r = (v: number) => Math.round(v * 100) / 100;
  const maxCltvPct = input.maxCltvPct ?? 85;

  // Equity / eligibility
  const currentEquity = Math.max(0, input.currentHomeValue - input.currentMortgageBalance);
  const maxCombinedDebt = input.currentHomeValue * (maxCltvPct / 100);
  const maxCreditLine = Math.max(0, maxCombinedDebt - input.currentMortgageBalance);

  const approvedCreditLine = Math.min(input.creditLimitRequested, maxCreditLine);
  const isOverLimit = input.creditLimitRequested > maxCreditLine;

  const ltv =
    input.currentHomeValue > 0
      ? (input.currentMortgageBalance / input.currentHomeValue) * 100
      : 0;
  const cltv =
    input.currentHomeValue > 0
      ? ((input.currentMortgageBalance + approvedCreditLine) / input.currentHomeValue) * 100
      : 0;

  // Draw period — interest-only on amount drawn
  const monthlyRate = input.interestRate / 100 / 12;
  const drawMonths = input.drawPeriodYears * 12;
  const monthlyDrawCapped = Math.min(input.monthlyDraw, approvedCreditLine / Math.max(drawMonths, 1));
  // Projected outstanding balance = cumulative draws (simple model: linear draw up to limit)
  const projectedDrawBalance = Math.min(monthlyDrawCapped * drawMonths, approvedCreditLine);
  // Average balance during draw period
  const avgDrawBalance = projectedDrawBalance / 2;
  const drawPeriodMonthlyInterest = r(avgDrawBalance * monthlyRate);
  const totalInterestDraw = r(drawPeriodMonthlyInterest * drawMonths);

  // Repayment period — P&I on balance at end of draw
  const repayMonths = input.repaymentPeriodYears * 12;
  const repaymentMonthlyPayment =
    projectedDrawBalance === 0 || repayMonths === 0
      ? 0
      : monthlyRate === 0
        ? projectedDrawBalance / repayMonths
        : (projectedDrawBalance * monthlyRate * Math.pow(1 + monthlyRate, repayMonths)) /
          (Math.pow(1 + monthlyRate, repayMonths) - 1);

  const totalRepaymentCost = r(repaymentMonthlyPayment * repayMonths);
  const totalInterestRepayment = r(Math.max(0, totalRepaymentCost - projectedDrawBalance));
  const totalInterest = r(totalInterestDraw + totalInterestRepayment);
  const totalCost = r(projectedDrawBalance + totalInterest);

  return {
    currentEquity: r(currentEquity),
    maxCombinedDebt: r(maxCombinedDebt),
    maxCreditLine: r(maxCreditLine),
    approvedCreditLine: r(approvedCreditLine),
    isOverLimit,
    ltv: Math.round(ltv * 100) / 100,
    cltv: Math.round(cltv * 100) / 100,
    projectedDrawBalance: r(projectedDrawBalance),
    drawPeriodMonthlyInterest: r(drawPeriodMonthlyInterest),
    repaymentMonthlyPayment: r(repaymentMonthlyPayment),
    totalInterestDraw,
    totalInterestRepayment,
    totalInterest,
    totalCost,
  };
}
