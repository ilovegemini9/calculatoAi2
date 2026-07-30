export interface HouseAffordabilityInput {
  annualIncome: number;
  monthlyDebts: number;       // existing monthly debt payments (car, student, credit cards)
  downPayment: number;
  interestRate: number;       // annual %, e.g. 6.85
  loanTermYears: number;
  propertyTaxRate: number;    // annual % of home value, e.g. 1.2
  homeInsuranceRate: number;  // annual % of home value, e.g. 0.5
  hoaMonthly: number;
  frontEndDtiLimit: number;   // e.g. 28
  backEndDtiLimit: number;    // e.g. 36
}

export interface HouseAffordabilityResult {
  maxHomePrice: number;
  maxLoanAmount: number;
  maxMonthlyPITI: number;
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  totalMonthlyDebt: number;   // housing + existing debts
  frontEndDti: number;        // actual front-end DTI %
  backEndDti: number;         // actual back-end DTI %
  frontEndMaxPayment: number;
  backEndMaxPayment: number;
  bindingConstraint: 'front-end' | 'back-end';
  downPaymentPercent: number;
  monthlyIncome: number;
}

/**
 * Reverse-PMT: given a maximum monthly P&I payment, compute the
 * maximum loan amount.
 *
 * L = M × [(1+r)^n − 1] / [r × (1+r)^n]
 */
function maxLoanFromPayment(maxPI: number, monthlyRate: number, n: number): number {
  if (monthlyRate === 0) return maxPI * n;
  const factor = Math.pow(1 + monthlyRate, n);
  return (maxPI * (factor - 1)) / (monthlyRate * factor);
}

export function calculateHouseAffordability(
  input: HouseAffordabilityInput,
): HouseAffordabilityResult {
  const {
    annualIncome,
    monthlyDebts,
    downPayment,
    interestRate,
    loanTermYears,
    propertyTaxRate,
    homeInsuranceRate,
    hoaMonthly,
    frontEndDtiLimit,
    backEndDtiLimit,
  } = input;

  const monthlyIncome = annualIncome / 12;
  const monthlyRate = interestRate / 100 / 12;
  const n = loanTermYears * 12;

  // The non-PI monthly costs are a function of home price.
  // We'll iterate to converge on max home price (tax & insurance scale with price).
  // Start with a rough estimate, then solve iteratively (3 passes converges well).

  const frontEndMaxPITI = monthlyIncome * (frontEndDtiLimit / 100);
  const backEndMaxPITI = Math.max(0, monthlyIncome * (backEndDtiLimit / 100) - monthlyDebts);

  const maxPITI = Math.min(frontEndMaxPITI, backEndMaxPITI);
  const bindingConstraint: 'front-end' | 'back-end' = backEndMaxPITI <= frontEndMaxPITI ? 'back-end' : 'front-end';

  // Monthly tax + insurance as fraction of home price (per month)
  const monthlyTaxAndInsRate = (propertyTaxRate / 100 + homeInsuranceRate / 100) / 12;

  // Iterative solve: maxPI = maxPITI - monthlyTaxAndInsRate * homePrice - HOA
  // homePrice = (maxPI_loan + downPayment)
  // maxPI_loan = maxLoanFromPayment(maxPI)
  // maxPI = maxPITI - monthlyTaxAndInsRate * (maxLoanFromPayment(maxPI) + downPayment) - HOA
  // Rearrange: we iterate 5 times starting from maxPI = maxPITI - HOA

  let maxPI = Math.max(0, maxPITI - hoaMonthly);
  for (let i = 0; i < 6; i++) {
    const loanEst = maxLoanFromPayment(maxPI, monthlyRate, n);
    const homePriceEst = loanEst + downPayment;
    const nonPI = monthlyTaxAndInsRate * homePriceEst + hoaMonthly;
    maxPI = Math.max(0, maxPITI - nonPI);
  }

  const maxLoanAmount = Math.max(0, maxLoanFromPayment(maxPI, monthlyRate, n));
  const maxHomePrice = Math.round((maxLoanAmount + downPayment) * 100) / 100;

  const monthlyTax = Math.round((maxHomePrice * propertyTaxRate / 100 / 12) * 100) / 100;
  const monthlyInsurance = Math.round((maxHomePrice * homeInsuranceRate / 100 / 12) * 100) / 100;
  const monthlyPI = Math.round(maxPI * 100) / 100;
  const maxMonthlyPITI = Math.round((monthlyPI + monthlyTax + monthlyInsurance + hoaMonthly) * 100) / 100;

  const frontEndDti = monthlyIncome > 0
    ? Math.round((maxMonthlyPITI / monthlyIncome) * 1000) / 10
    : 0;
  const backEndDti = monthlyIncome > 0
    ? Math.round(((maxMonthlyPITI + monthlyDebts) / monthlyIncome) * 1000) / 10
    : 0;

  const downPaymentPercent =
    maxHomePrice > 0 ? Math.round((downPayment / maxHomePrice) * 1000) / 10 : 0;

  return {
    maxHomePrice: Math.round(maxHomePrice),
    maxLoanAmount: Math.round(maxLoanAmount),
    maxMonthlyPITI,
    monthlyPI,
    monthlyTax,
    monthlyInsurance,
    monthlyHoa: hoaMonthly,
    totalMonthlyDebt: Math.round((maxMonthlyPITI + monthlyDebts) * 100) / 100,
    frontEndDti,
    backEndDti,
    frontEndMaxPayment: Math.round(frontEndMaxPITI * 100) / 100,
    backEndMaxPayment: Math.round(backEndMaxPITI * 100) / 100,
    bindingConstraint,
    downPaymentPercent,
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
  };
}
