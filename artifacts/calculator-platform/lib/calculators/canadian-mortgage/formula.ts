/**
 * Canadian Mortgage Calculator Formula
 *
 * Key difference from US mortgages: Canadian law (Interest Act) requires that
 * mortgage interest is compounded semi-annually, not monthly.
 *
 * Conversion:
 *   effective monthly rate = (1 + nominalAnnualRate / 200) ^ (1/6) - 1
 *
 * CMHC (mortgage default insurance) is required when down payment < 20%.
 * The premium is added to the mortgage principal.
 */

export interface CanadianMortgageInput {
  homePrice: number;         // CAD
  downPayment: number;       // CAD
  annualRate: number;        // nominal annual rate, e.g. 5.25
  amortizationYears: number; // 5 to 30 (max 25 with CMHC)
  paymentFrequency: 'monthly' | 'bi-weekly' | 'accelerated-bi-weekly';
  propertyTaxAnnual?: number; // CAD/yr
  condoFeeMonthly?: number;   // CAD/mo
}

export interface CanadianMortgageResult {
  loanAmount: number;           // before CMHC
  cmhcPremium: number;          // 0 if down ≥ 20 %
  cmhcRate: number;             // premium as a fraction, e.g. 0.04
  totalMortgage: number;        // loan + CMHC
  downPaymentPct: number;
  effectiveMonthlyRate: number; // (1 + r/200)^(1/6) - 1
  periodicPayment: number;      // payment per chosen frequency
  monthlyEquivalent: number;    // always-monthly version for comparisons
  totalInterest: number;
  totalCost: number;            // principal + interest (excl. tax/condo)
  paymentsPerYear: number;
  totalPayments: number;
  monthlyPropertyTax: number;
  monthlyCondoFee: number;
  totalMonthlyOutlay: number;   // P&I (monthly equiv) + tax + condo
  amortization: AmortizationRow[];
}

export interface AmortizationRow {
  paymentNumber: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

/** CMHC premium rate based on LTV */
function cmhcPremiumRate(downPct: number): number {
  if (downPct >= 20) return 0;
  if (downPct >= 15) return 0.028;
  if (downPct >= 10) return 0.031;
  return 0.04; // 5 % – 9.99 %
}

export function calculateCanadianMortgage(input: CanadianMortgageInput): CanadianMortgageResult {
  const { homePrice, downPayment, annualRate, amortizationYears, paymentFrequency } = input;

  const loanAmount = Math.max(0, homePrice - downPayment);
  const downPct = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;

  // CMHC insurance
  const cmhcRate = cmhcPremiumRate(downPct);
  const cmhcPremium = Math.round(loanAmount * cmhcRate * 100) / 100;
  const totalMortgage = loanAmount + cmhcPremium;

  // Canadian semi-annual compounding → effective monthly rate
  const effectiveMonthlyRate = Math.pow(1 + annualRate / 200, 1 / 6) - 1;

  // Payments per year and effective rate per period
  let paymentsPerYear: number;
  let ratePerPeriod: number;

  if (paymentFrequency === 'monthly') {
    paymentsPerYear = 12;
    ratePerPeriod = effectiveMonthlyRate;
  } else if (paymentFrequency === 'bi-weekly') {
    // True bi-weekly: 26 payments/yr, rate = (1 + monthlyRate)^(1/2) - 1
    paymentsPerYear = 26;
    ratePerPeriod = Math.pow(1 + effectiveMonthlyRate, 1 / 2) - 1;
  } else {
    // Accelerated bi-weekly: monthly payment ÷ 2 — effectively one extra
    // monthly payment per year, so we compute the monthly payment and halve it.
    paymentsPerYear = 26;
    ratePerPeriod = effectiveMonthlyRate; // used only for monthly computation below
  }

  const totalPaymentsMonthly = amortizationYears * 12;

  // Monthly P&I payment (used for accelerated bi-weekly and display)
  const monthlyPayment =
    effectiveMonthlyRate === 0
      ? totalMortgage / totalPaymentsMonthly
      : (totalMortgage * effectiveMonthlyRate * Math.pow(1 + effectiveMonthlyRate, totalPaymentsMonthly)) /
        (Math.pow(1 + effectiveMonthlyRate, totalPaymentsMonthly) - 1);

  let periodicPayment: number;
  let totalPayments: number;

  if (paymentFrequency === 'accelerated-bi-weekly') {
    periodicPayment = monthlyPayment / 2;
    // Actual total payments: amortize using the bi-weekly rate
    const bwRate = Math.pow(1 + effectiveMonthlyRate, 1 / 2) - 1;
    // Find n where P * ((1+r)^n - 1) / r = PV * (1+r)^n
    // Solve numerically: n = -ln(1 - PV*r/P) / ln(1+r)
    const n = bwRate === 0
      ? totalMortgage / periodicPayment
      : -Math.log(1 - (totalMortgage * bwRate) / periodicPayment) / Math.log(1 + bwRate);
    totalPayments = Math.ceil(n);
    ratePerPeriod = bwRate;
  } else if (paymentFrequency === 'bi-weekly') {
    const totalPeriods = amortizationYears * paymentsPerYear;
    periodicPayment =
      ratePerPeriod === 0
        ? totalMortgage / totalPeriods
        : (totalMortgage * ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPeriods)) /
          (Math.pow(1 + ratePerPeriod, totalPeriods) - 1);
    totalPayments = totalPeriods;
  } else {
    periodicPayment = monthlyPayment;
    totalPayments = totalPaymentsMonthly;
  }

  // Amortization schedule (in payment periods)
  const amortization: AmortizationRow[] = [];
  let balance = totalMortgage;
  let totalInterest = 0;

  for (let i = 1; i <= totalPayments; i++) {
    const interestPaid = balance * ratePerPeriod;
    const principalPaid = i === totalPayments ? balance : periodicPayment - interestPaid;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interestPaid;
    amortization.push({
      paymentNumber: i,
      payment: Math.round(periodicPayment * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  // Ancillary monthly costs
  const monthlyPropertyTax = (input.propertyTaxAnnual ?? 0) / 12;
  const monthlyCondoFee = input.condoFeeMonthly ?? 0;
  const monthlyEquivalent =
    paymentFrequency === 'monthly'
      ? periodicPayment
      : paymentFrequency === 'bi-weekly'
      ? (periodicPayment * 26) / 12
      : (periodicPayment * 26) / 12;

  return {
    loanAmount: Math.round(loanAmount * 100) / 100,
    cmhcPremium: Math.round(cmhcPremium * 100) / 100,
    cmhcRate,
    totalMortgage: Math.round(totalMortgage * 100) / 100,
    downPaymentPct: Math.round(downPct * 10) / 10,
    effectiveMonthlyRate,
    periodicPayment: Math.round(periodicPayment * 100) / 100,
    monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round((totalMortgage + totalInterest) * 100) / 100,
    paymentsPerYear,
    totalPayments,
    monthlyPropertyTax: Math.round(monthlyPropertyTax * 100) / 100,
    monthlyCondoFee: Math.round(monthlyCondoFee * 100) / 100,
    totalMonthlyOutlay: Math.round((monthlyEquivalent + monthlyPropertyTax + monthlyCondoFee) * 100) / 100,
    amortization,
  };
}
