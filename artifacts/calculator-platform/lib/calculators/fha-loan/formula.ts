// FHA Loan rules per HUD guidelines (2024)
// Upfront MIP: 1.75% of base loan amount (can be financed)
// Annual MIP rates depend on loan term and LTV:
//   30-yr, LTV >90%:  0.55%/yr  |  LTV ≤90%: 0.50%/yr
//   15-yr, LTV >90%:  0.40%/yr  |  LTV ≤90%: 0.15%/yr
// Minimum down payment: 3.5% (score ≥ 580)

export interface FHALoanInput {
  homePrice: number;
  downPayment: number; // min 3.5% of homePrice
  interestRate: number; // annual %
  loanTermYears: number; // typically 15 or 30
  financeUpfrontMip: boolean; // roll UFMIP into loan?
  propertyTaxRate: number; // annual % of home value
  homeInsuranceAnnual: number;
  hoaMonthly?: number;
}

export interface FHALoanResult {
  // Loan
  baseLoanAmount: number;
  downPaymentPct: number;
  ltv: number;

  // MIP
  upfrontMipAmount: number;
  upfrontMipFinanced: number; // how much is added to loan
  totalLoanAmount: number; // base + financed UFMIP
  annualMipRate: number; // %
  monthlyMip: number;

  // Payments
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  totalMonthlyPayment: number;

  // Totals
  totalInterest: number;
  totalMipPaid: number;
  totalCost: number;

  // MIP duration
  mipDurationMonths: number; // how many months MIP applies
}

function getAnnualMipRate(ltv: number, termYears: number): number {
  if (termYears > 15) {
    return ltv > 90 ? 0.55 : 0.50;
  } else {
    return ltv > 90 ? 0.40 : 0.15;
  }
}

function getMipDurationMonths(ltv: number, termYears: number): number {
  // Per HUD 2013+ rules:
  // LTV ≤ 90% at origination: 11 years
  // LTV > 90%: full loan term
  if (ltv <= 90) return 11 * 12;
  return termYears * 12;
}

export function calculateFHALoan(input: FHALoanInput): FHALoanResult {
  const baseLoanAmount = Math.max(0, input.homePrice - input.downPayment);
  const downPaymentPct = input.homePrice > 0 ? (input.downPayment / input.homePrice) * 100 : 0;
  const ltv = input.homePrice > 0 ? (baseLoanAmount / input.homePrice) * 100 : 0;

  // Upfront MIP (always 1.75%)
  const upfrontMipAmount = baseLoanAmount * 0.0175;
  const upfrontMipFinanced = input.financeUpfrontMip ? upfrontMipAmount : 0;
  const upfrontMipCash = input.financeUpfrontMip ? 0 : upfrontMipAmount;
  const totalLoanAmount = baseLoanAmount + upfrontMipFinanced;

  // Monthly P&I
  const monthlyRate = input.interestRate / 100 / 12;
  const n = input.loanTermYears * 12;
  const monthlyPandI =
    monthlyRate === 0
      ? totalLoanAmount / n
      : (totalLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1);

  // Annual MIP
  const annualMipRate = getAnnualMipRate(ltv, input.loanTermYears);
  const monthlyMip = (totalLoanAmount * (annualMipRate / 100)) / 12;
  const mipDurationMonths = getMipDurationMonths(ltv, input.loanTermYears);

  // Other monthly costs
  const monthlyPropertyTax = ((input.propertyTaxRate / 100) * input.homePrice) / 12;
  const monthlyInsurance = input.homeInsuranceAnnual / 12;
  const monthlyHoa = input.hoaMonthly || 0;

  const totalMonthlyPayment = monthlyPandI + monthlyMip + monthlyPropertyTax + monthlyInsurance + monthlyHoa;

  // Totals
  let totalInterest = 0;
  let balance = totalLoanAmount;
  for (let i = 1; i <= n; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = i === n ? balance : monthlyPandI - interestPayment;
    balance = Math.max(0, balance - principalPayment);
    totalInterest += interestPayment;
  }

  const totalMipPaid = upfrontMipCash + monthlyMip * Math.min(mipDurationMonths, n);
  const totalCost = input.homePrice + totalInterest + totalMipPaid;

  const r = (v: number) => Math.round(v * 100) / 100;

  return {
    baseLoanAmount: r(baseLoanAmount),
    downPaymentPct: Math.round(downPaymentPct * 100) / 100,
    ltv: Math.round(ltv * 100) / 100,
    upfrontMipAmount: r(upfrontMipAmount),
    upfrontMipFinanced: r(upfrontMipFinanced),
    totalLoanAmount: r(totalLoanAmount),
    annualMipRate,
    monthlyMip: r(monthlyMip),
    monthlyPrincipalAndInterest: r(monthlyPandI),
    monthlyPropertyTax: r(monthlyPropertyTax),
    monthlyInsurance: r(monthlyInsurance),
    monthlyHoa: r(monthlyHoa),
    totalMonthlyPayment: r(totalMonthlyPayment),
    totalInterest: r(totalInterest),
    totalMipPaid: r(totalMipPaid),
    totalCost: r(totalCost),
    mipDurationMonths,
  };
}
