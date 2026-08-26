export interface BusinessValuationResult {
  ebitda: number;
  enterpriseValue: number;
  equityValue: number;
  revenueMultiple: number;
  error?: string;
}

export function calculateBusinessValuation(
  annualRevenue: number,
  ebitdaMarginPercent: number,
  valuationMultiple: number,
  netDebt: number,
): BusinessValuationResult {
  const revenue = Math.max(0, annualRevenue);
  const margin = Math.max(0, ebitdaMarginPercent) / 100;
  const multiple = Math.max(0, valuationMultiple);
  const debt = Math.max(0, netDebt);
  const ebitda = revenue * margin;
  const enterpriseValue = ebitda * multiple;
  return { ebitda, enterpriseValue, equityValue: enterpriseValue - debt, revenueMultiple: revenue > 0 ? enterpriseValue / revenue : 0 };
}

export interface DscrResult {
  dscr: number;
  annualSurplus: number;
  maximumAnnualDebtService: number;
  error?: string;
}

export function calculateDscr(annualNetOperatingIncome: number, annualDebtService: number): DscrResult {
  const noi = Math.max(0, annualNetOperatingIncome);
  const debtService = Math.max(0, annualDebtService);
  if (debtService <= 0) {
    return { dscr: 0, annualSurplus: noi, maximumAnnualDebtService: 0, error: 'Enter a positive annual debt service amount.' };
  }
  return { dscr: noi / debtService, annualSurplus: noi - debtService, maximumAnnualDebtService: noi };
}

export interface CarAffordabilityResult {
  maximumMonthlyPayment: number;
  supportedLoanAmount: number;
  estimatedVehiclePrice: number;
  totalInterest: number;
  error?: string;
}

export function calculateCarAffordability(
  monthlyIncome: number,
  monthlyDebts: number,
  downPayment: number,
  debtBudgetPercent: number,
  annualRatePercent: number,
  termMonths: number,
): CarAffordabilityResult {
  const income = Math.max(0, monthlyIncome);
  const debts = Math.max(0, monthlyDebts);
  const down = Math.max(0, downPayment);
  const debtBudget = Math.max(0, debtBudgetPercent) / 100;
  const monthlyRate = Math.max(0, annualRatePercent) / 100 / 12;
  const months = Math.max(1, Math.floor(termMonths));
  const payment = income * debtBudget - debts;
  if (payment <= 0) {
    return { maximumMonthlyPayment: 0, supportedLoanAmount: 0, estimatedVehiclePrice: down, totalInterest: 0, error: 'Income and debt assumptions leave no positive monthly vehicle-payment budget.' };
  }
  const loan = monthlyRate === 0
    ? payment * months
    : payment * (1 - (1 + monthlyRate) ** -months) / monthlyRate;
  return { maximumMonthlyPayment: payment, supportedLoanAmount: loan, estimatedVehiclePrice: loan + down, totalInterest: payment * months - loan };
}

export interface BondYieldResult {
  annualCoupon: number;
  currentYieldPercent: number;
  approximateYtmPercent: number;
  premiumOrDiscount: number;
  error?: string;
}

export function calculateBondYield(
  faceValue: number,
  couponRatePercent: number,
  marketPrice: number,
  yearsToMaturity: number,
): BondYieldResult {
  const face = Math.max(0, faceValue);
  const couponRate = Math.max(0, couponRatePercent) / 100;
  const price = Math.max(0, marketPrice);
  const years = Math.max(1, yearsToMaturity);
  const annualCoupon = face * couponRate;
  if (price <= 0 || face <= 0) {
    return { annualCoupon, currentYieldPercent: 0, approximateYtmPercent: 0, premiumOrDiscount: price - face, error: 'Enter positive face value and market price.' };
  }
  const currentYieldPercent = annualCoupon / price * 100;
  const approximateYtmPercent = ((annualCoupon + (face - price) / years) / ((face + price) / 2)) * 100;
  return { annualCoupon, currentYieldPercent, approximateYtmPercent, premiumOrDiscount: price - face };
}
