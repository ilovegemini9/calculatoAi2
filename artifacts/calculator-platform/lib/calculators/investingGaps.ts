export interface BreakEvenResult {
  contributionMargin: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  error?: string;
}

export function calculateBreakEven(
  fixedCosts: number,
  pricePerUnit: number,
  variableCostPerUnit: number,
): BreakEvenResult {
  const fixed = Math.max(0, fixedCosts);
  const price = Math.max(0, pricePerUnit);
  const variable = Math.max(0, variableCostPerUnit);
  const margin = price - variable;
  if (margin <= 0) {
    return { contributionMargin: margin, breakEvenUnits: 0, breakEvenRevenue: 0, error: 'Price per unit must be greater than variable cost per unit.' };
  }
  const units = fixed / margin;
  return { contributionMargin: margin, breakEvenUnits: units, breakEvenRevenue: units * price };
}

export interface DcfResult {
  enterpriseValue: number;
  presentValueForecast: number;
  presentValueTerminal: number;
  terminalValue: number;
  finalYearCashFlow: number;
  error?: string;
}

export function calculateDcf(
  initialCashFlow: number,
  growthRatePercent: number,
  discountRatePercent: number,
  terminalGrowthPercent: number,
  years: number,
): DcfResult {
  const cashFlow = Math.max(0, initialCashFlow);
  const growth = growthRatePercent / 100;
  const discount = discountRatePercent / 100;
  const terminalGrowth = terminalGrowthPercent / 100;
  const periods = Math.max(1, Math.floor(years));
  if (discount <= terminalGrowth) {
    return { enterpriseValue: 0, presentValueForecast: 0, presentValueTerminal: 0, terminalValue: 0, finalYearCashFlow: 0, error: 'Discount rate must be greater than terminal growth rate.' };
  }
  let presentValueForecast = 0;
  let finalYearCashFlow = cashFlow;
  for (let year = 1; year <= periods; year += 1) {
    finalYearCashFlow *= 1 + growth;
    presentValueForecast += finalYearCashFlow / ((1 + discount) ** year);
  }
  const terminalValue = finalYearCashFlow * (1 + terminalGrowth) / (discount - terminalGrowth);
  const presentValueTerminal = terminalValue / ((1 + discount) ** periods);
  return {
    enterpriseValue: presentValueForecast + presentValueTerminal,
    presentValueForecast,
    presentValueTerminal,
    terminalValue,
    finalYearCashFlow,
  };
}

export interface CapitalGainsResult {
  adjustedBasis: number;
  netSaleProceeds: number;
  realizedGain: number;
  taxableGain: number;
  estimatedTax: number;
  afterTaxProceeds: number;
}

export function calculateCapitalGains(
  purchasePrice: number,
  salePrice: number,
  sellingCosts: number,
  capitalImprovements: number,
  taxRatePercent: number,
): CapitalGainsResult {
  const basis = Math.max(0, purchasePrice) + Math.max(0, capitalImprovements);
  const netSaleProceeds = Math.max(0, salePrice) - Math.max(0, sellingCosts);
  const realizedGain = netSaleProceeds - basis;
  const taxableGain = Math.max(0, realizedGain);
  const estimatedTax = taxableGain * Math.max(0, taxRatePercent) / 100;
  return {
    adjustedBasis: basis,
    netSaleProceeds,
    realizedGain,
    taxableGain,
    estimatedTax,
    afterTaxProceeds: netSaleProceeds - estimatedTax,
  };
}

export interface DividendResult {
  annualIncome: number;
  monthlyIncome: number;
  quarterlyIncome: number;
  portfolioValue: number;
  dividendYieldPercent: number;
  error?: string;
}

export function calculateDividend(
  shares: number,
  annualDividendPerShare: number,
  sharePrice: number,
): DividendResult {
  const shareCount = Math.max(0, shares);
  const dividend = Math.max(0, annualDividendPerShare);
  const price = Math.max(0, sharePrice);
  const annualIncome = shareCount * dividend;
  const portfolioValue = shareCount * price;
  if (portfolioValue <= 0) {
    return { annualIncome, monthlyIncome: annualIncome / 12, quarterlyIncome: annualIncome / 4, portfolioValue, dividendYieldPercent: 0, error: 'Enter a positive share price and at least one share to calculate yield.' };
  }
  return { annualIncome, monthlyIncome: annualIncome / 12, quarterlyIncome: annualIncome / 4, portfolioValue, dividendYieldPercent: annualIncome / portfolioValue * 100 };
}
