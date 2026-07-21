export interface RealEstateInput {
  purchasePrice: number;
  downPayment: number;
  closingCostsPct: number; // % of purchase price
  interestRate: number; // annual %
  loanTermYears: number;
  appreciationRatePct: number; // annual % home appreciation
  yearsHeld: number;
  sellingCostsPct: number; // % of sale price (agent + transfer tax)
  monthlyRent?: number; // if used as rental
  annualOperatingExpenses?: number; // taxes + insurance + maintenance
}

export interface RealEstateResult {
  // Purchase
  loanAmount: number;
  closingCosts: number;
  totalCashInvested: number;

  // Future value
  homeValueAtSale: number;
  remainingLoanBalance: number;
  sellingCosts: number;
  netSaleProceeds: number;

  // Profit
  totalMortgagePaid: number;
  totalEquityBuilt: number;
  grossProfit: number;
  netProfit: number; // after all costs
  roi: number; // % return on cash invested
  annualizedRoi: number; // % CAGR

  // Rental (optional)
  totalRentalIncome?: number;
  netRentalProfit?: number;

  // Monthly payment
  monthlyPayment: number;
}

export function calculateRealEstate(input: RealEstateInput): RealEstateResult {
  const loanAmount = Math.max(0, input.purchasePrice - input.downPayment);
  const closingCosts = input.purchasePrice * (input.closingCostsPct / 100);
  const totalCashInvested = input.downPayment + closingCosts;

  // Monthly mortgage
  const monthlyRate = input.interestRate / 100 / 12;
  const n = input.loanTermYears * 12;
  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / n
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1);

  // Remaining balance after yearsHeld
  const paymentsMade = Math.min(input.yearsHeld * 12, n);
  const remainingLoanBalance =
    monthlyRate === 0
      ? Math.max(0, loanAmount - monthlyPayment * paymentsMade)
      : loanAmount * Math.pow(1 + monthlyRate, paymentsMade) -
        monthlyPayment * ((Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate);

  // Home value at sale
  const homeValueAtSale =
    input.purchasePrice * Math.pow(1 + input.appreciationRatePct / 100, input.yearsHeld);

  // Selling costs
  const sellingCosts = homeValueAtSale * (input.sellingCostsPct / 100);
  const netSaleProceeds = homeValueAtSale - sellingCosts - Math.max(0, remainingLoanBalance);

  // Mortgage paid
  const totalMortgagePaid = monthlyPayment * paymentsMade;
  const totalEquityBuilt = homeValueAtSale - sellingCosts - Math.max(0, remainingLoanBalance);

  // Profit
  const grossProfit = homeValueAtSale - input.purchasePrice;
  const netProfit = netSaleProceeds - totalCashInvested - (totalMortgagePaid - (loanAmount - Math.max(0, remainingLoanBalance)));

  const roi = totalCashInvested > 0 ? (netProfit / totalCashInvested) * 100 : 0;
  const annualizedRoi =
    totalCashInvested > 0 && input.yearsHeld > 0
      ? (Math.pow(1 + roi / 100, 1 / input.yearsHeld) - 1) * 100
      : 0;

  // Rental (optional)
  let totalRentalIncome: number | undefined;
  let netRentalProfit: number | undefined;
  if (input.monthlyRent && input.monthlyRent > 0) {
    totalRentalIncome = input.monthlyRent * 12 * input.yearsHeld;
    const totalOpEx = (input.annualOperatingExpenses || 0) * input.yearsHeld;
    netRentalProfit = totalRentalIncome - totalOpEx;
  }

  const r = (v: number) => Math.round(v * 100) / 100;

  return {
    loanAmount: r(loanAmount),
    closingCosts: r(closingCosts),
    totalCashInvested: r(totalCashInvested),
    homeValueAtSale: r(homeValueAtSale),
    remainingLoanBalance: r(Math.max(0, remainingLoanBalance)),
    sellingCosts: r(sellingCosts),
    netSaleProceeds: r(netSaleProceeds),
    totalMortgagePaid: r(totalMortgagePaid),
    totalEquityBuilt: r(totalEquityBuilt),
    grossProfit: r(grossProfit),
    netProfit: r(netProfit),
    roi: Math.round(roi * 100) / 100,
    annualizedRoi: Math.round(annualizedRoi * 100) / 100,
    totalRentalIncome: totalRentalIncome !== undefined ? r(totalRentalIncome) : undefined,
    netRentalProfit: netRentalProfit !== undefined ? r(netRentalProfit) : undefined,
    monthlyPayment: r(monthlyPayment),
  };
}
