export interface RentalPropertyInput {
  purchasePrice: number;
  downPayment: number;
  interestRate: number; // annual %
  loanTermYears: number;
  monthlyRent: number;
  propertyTaxRate: number; // annual % of value
  insuranceAnnual: number;
  maintenancePct: number; // annual % of value
  vacancyRatePct: number; // % of gross rent
  managementFeePct: number; // % of gross rent
  closingCostsPct: number; // % of purchase price
}

export interface RentalPropertyResult {
  // Investment
  loanAmount: number;
  totalCashInvested: number; // down payment + closing costs

  // Income
  grossAnnualRent: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;

  // Expenses (annual)
  annualMortgage: number;
  annualPropertyTax: number;
  annualInsurance: number;
  annualMaintenance: number;
  annualManagement: number;
  totalAnnualExpenses: number;

  // Key metrics
  netOperatingIncome: number; // before mortgage
  annualCashFlow: number; // after mortgage
  monthlyCashFlow: number;
  cashOnCashReturn: number; // %
  capRate: number; // %
  grossRentMultiplier: number;
  monthlyPayment: number; // P&I only
}

export function calculateRentalProperty(input: RentalPropertyInput): RentalPropertyResult {
  const loanAmount = Math.max(0, input.purchasePrice - input.downPayment);
  const closingCosts = input.purchasePrice * (input.closingCostsPct / 100);
  const totalCashInvested = input.downPayment + closingCosts;

  // Monthly mortgage P&I
  const monthlyRate = input.interestRate / 100 / 12;
  const n = input.loanTermYears * 12;
  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / n
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1);

  // Income
  const grossAnnualRent = input.monthlyRent * 12;
  const vacancyLoss = grossAnnualRent * (input.vacancyRatePct / 100);
  const effectiveGrossIncome = grossAnnualRent - vacancyLoss;

  // Expenses (annual)
  const annualMortgage = monthlyPayment * 12;
  const annualPropertyTax = (input.propertyTaxRate / 100) * input.purchasePrice;
  const annualInsurance = input.insuranceAnnual;
  const annualMaintenance = (input.maintenancePct / 100) * input.purchasePrice;
  const annualManagement = effectiveGrossIncome * (input.managementFeePct / 100);
  const annualOperatingExpenses =
    annualPropertyTax + annualInsurance + annualMaintenance + annualManagement;
  const totalAnnualExpenses = annualOperatingExpenses + annualMortgage;

  // Metrics
  const netOperatingIncome = effectiveGrossIncome - annualOperatingExpenses;
  const annualCashFlow = netOperatingIncome - annualMortgage;
  const monthlyCashFlow = annualCashFlow / 12;
  const cashOnCashReturn = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const capRate = input.purchasePrice > 0 ? (netOperatingIncome / input.purchasePrice) * 100 : 0;
  const grossRentMultiplier =
    grossAnnualRent > 0 ? input.purchasePrice / grossAnnualRent : 0;

  const r = (v: number) => Math.round(v * 100) / 100;

  return {
    loanAmount: r(loanAmount),
    totalCashInvested: r(totalCashInvested),
    grossAnnualRent: r(grossAnnualRent),
    vacancyLoss: r(vacancyLoss),
    effectiveGrossIncome: r(effectiveGrossIncome),
    annualMortgage: r(annualMortgage),
    annualPropertyTax: r(annualPropertyTax),
    annualInsurance: r(annualInsurance),
    annualMaintenance: r(annualMaintenance),
    annualManagement: r(annualManagement),
    totalAnnualExpenses: r(totalAnnualExpenses),
    netOperatingIncome: r(netOperatingIncome),
    annualCashFlow: r(annualCashFlow),
    monthlyCashFlow: r(monthlyCashFlow),
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    capRate: Math.round(capRate * 100) / 100,
    grossRentMultiplier: Math.round(grossRentMultiplier * 100) / 100,
    monthlyPayment: r(monthlyPayment),
  };
}
