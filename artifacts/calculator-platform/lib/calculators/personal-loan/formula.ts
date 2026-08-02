/**
 * Personal Loan Calculator Formula
 *
 * Standard amortizing loan with optional origination fee.
 * APR is computed using the Newton-Raphson method to find the exact rate
 * that equates the present value of payments to the net proceeds.
 */

export interface PersonalLoanInput {
  loanAmount: number;       // principal requested
  annualRate: number;       // nominal annual interest rate, e.g. 12.5
  termMonths: number;       // loan term in months
  originationFeePct?: number; // fee as % of loan amount (deducted from proceeds)
  originationFeeFlat?: number; // flat origination fee (alternative to %)
}

export interface PersonalLoanAmortizationRow {
  paymentNumber: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

export interface PersonalLoanResult {
  loanAmount: number;
  originationFee: number;
  netProceeds: number;        // what you actually receive
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;          // total of all payments
  apr: number;                // true APR including fees, annualised
  amortization: PersonalLoanAmortizationRow[];
}

/**
 * Estimate APR via Newton-Raphson.
 * netProceeds = monthly * sum_{k=1..n} (1+r)^{-k}
 * Solve for r, then APR = r * 12.
 */
function estimateApr(netProceeds: number, monthlyPayment: number, termMonths: number): number {
  if (netProceeds <= 0 || monthlyPayment <= 0) return 0;
  let r = monthlyPayment / netProceeds / termMonths; // initial guess
  for (let i = 0; i < 100; i++) {
    const p = Math.pow(1 + r, termMonths);
    const pv = monthlyPayment * (p - 1) / (r * p);
    const dpv = monthlyPayment * (
      (termMonths * Math.pow(1 + r, termMonths - 1) * r * p - (p - 1) * (r * termMonths * Math.pow(1 + r, termMonths - 1) + p)) /
      Math.pow(r * p, 2)
    );
    const delta = (pv - netProceeds) / dpv;
    r -= delta;
    if (Math.abs(delta) < 1e-10) break;
  }
  return Math.max(0, r * 12 * 100); // annualised %
}

export function calculatePersonalLoan(input: PersonalLoanInput): PersonalLoanResult {
  const { loanAmount, annualRate, termMonths } = input;

  const feeFromPct = loanAmount * ((input.originationFeePct ?? 0) / 100);
  const originationFee = Math.round((feeFromPct + (input.originationFeeFlat ?? 0)) * 100) / 100;
  const netProceeds = Math.max(0, loanAmount - originationFee);

  const monthlyRate = annualRate / 100 / 12;

  // Payment is based on full loan amount (fee is an upfront cost)
  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / termMonths
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  const amortization: PersonalLoanAmortizationRow[] = [];
  let balance = loanAmount;
  let totalInterest = 0;

  for (let i = 1; i <= termMonths; i++) {
    const interestPaid = balance * monthlyRate;
    const principalPaid = i === termMonths ? balance : monthlyPayment - interestPaid;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interestPaid;
    amortization.push({
      paymentNumber: i,
      payment: Math.round(monthlyPayment * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  const totalCost = Math.round((monthlyPayment * termMonths + originationFee) * 100) / 100;
  const apr = netProceeds > 0 && originationFee > 0
    ? Math.round(estimateApr(netProceeds, monthlyPayment, termMonths) * 100) / 100
    : annualRate;

  return {
    loanAmount: Math.round(loanAmount * 100) / 100,
    originationFee,
    netProceeds: Math.round(netProceeds * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost,
    apr,
    amortization,
  };
}
