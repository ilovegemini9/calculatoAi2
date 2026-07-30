// VA Loan rules per VA Funding Fee tables (2024)
// No PMI, no minimum down payment required
// Funding fee varies by use type, down payment, and loan type
// Exempt: veterans with service-connected disability, surviving spouses

export type VALoanUse = 'first' | 'subsequent';

export interface VAMortgageInput {
  homePrice: number;
  downPayment: number;
  interestRate: number; // annual %
  loanTermYears: number;
  loanUse: VALoanUse;
  isFundingFeeExempt: boolean; // disability / surviving spouse
  financeFundingFee: boolean; // roll fee into loan
  propertyTaxRate: number; // annual % of home value
  homeInsuranceAnnual: number;
  hoaMonthly?: number;
}

export interface VAMortgageResult {
  // Loan
  baseLoanAmount: number;
  downPaymentPct: number;
  ltv: number;

  // Funding fee
  fundingFeeRate: number; // %
  fundingFeeAmount: number;
  fundingFeeFinanced: number;
  totalLoanAmount: number;

  // Payments
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  totalMonthlyPayment: number;

  // Totals
  totalInterest: number;
  totalCost: number;

  // Comparison
  savingsVsConventionalPmi: number; // approx PMI savings over life of loan
}

function getVAFundingFeeRate(
  loanUse: VALoanUse,
  downPaymentPct: number,
  isExempt: boolean
): number {
  if (isExempt) return 0;

  if (loanUse === 'first') {
    if (downPaymentPct >= 10) return 1.25;
    if (downPaymentPct >= 5) return 1.50;
    return 2.15;
  } else {
    // subsequent use
    if (downPaymentPct >= 10) return 1.25;
    if (downPaymentPct >= 5) return 1.50;
    return 3.30;
  }
}

export function calculateVAMortgage(input: VAMortgageInput): VAMortgageResult {
  const baseLoanAmount = Math.max(0, input.homePrice - input.downPayment);
  const downPaymentPct = input.homePrice > 0 ? (input.downPayment / input.homePrice) * 100 : 0;
  const ltv = input.homePrice > 0 ? (baseLoanAmount / input.homePrice) * 100 : 0;

  // Funding fee
  const fundingFeeRate = getVAFundingFeeRate(input.loanUse, downPaymentPct, input.isFundingFeeExempt);
  const fundingFeeAmount = baseLoanAmount * (fundingFeeRate / 100);
  const fundingFeeFinanced = input.financeFundingFee ? fundingFeeAmount : 0;
  const totalLoanAmount = baseLoanAmount + fundingFeeFinanced;

  // Monthly P&I
  const monthlyRate = input.interestRate / 100 / 12;
  const n = input.loanTermYears * 12;
  const monthlyPandI =
    monthlyRate === 0
      ? totalLoanAmount / n
      : (totalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1);

  // Other monthly costs
  const monthlyPropertyTax = ((input.propertyTaxRate / 100) * input.homePrice) / 12;
  const monthlyInsurance = input.homeInsuranceAnnual / 12;
  const monthlyHoa = input.hoaMonthly || 0;

  const totalMonthlyPayment = monthlyPandI + monthlyPropertyTax + monthlyInsurance + monthlyHoa;

  // Total interest
  let totalInterest = 0;
  let balance = totalLoanAmount;
  for (let i = 1; i <= n; i++) {
    const interest = balance * monthlyRate;
    const principal = i === n ? balance : monthlyPandI - interest;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
  }

  const fundingFeeCashPaid = input.financeFundingFee ? 0 : fundingFeeAmount;
  const totalCost = input.homePrice + totalInterest + fundingFeeCashPaid;

  // PMI savings: conventional PMI ~0.85% of loan/yr for LTV > 80%, 7 years avg
  const conventionalPmi = ltv > 80 ? baseLoanAmount * 0.0085 * 7 : 0;
  const savingsVsConventionalPmi = Math.max(0, conventionalPmi - fundingFeeAmount);

  const r = (v: number) => Math.round(v * 100) / 100;

  return {
    baseLoanAmount: r(baseLoanAmount),
    downPaymentPct: Math.round(downPaymentPct * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    fundingFeeRate,
    fundingFeeAmount: r(fundingFeeAmount),
    fundingFeeFinanced: r(fundingFeeFinanced),
    totalLoanAmount: r(totalLoanAmount),
    monthlyPrincipalAndInterest: r(monthlyPandI),
    monthlyPropertyTax: r(monthlyPropertyTax),
    monthlyInsurance: r(monthlyInsurance),
    monthlyHoa: r(monthlyHoa),
    totalMonthlyPayment: r(totalMonthlyPayment),
    totalInterest: r(totalInterest),
    totalCost: r(totalCost),
    savingsVsConventionalPmi: r(savingsVsConventionalPmi),
  };
}
