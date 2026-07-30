export interface RentVsBuyInput {
  // Buying inputs
  homePrice: number;
  downPayment: number;
  mortgageRate: number;        // annual %, e.g. 6.85
  loanTermYears: number;
  propertyTaxRate: number;     // annual % of home value, e.g. 1.2
  homeInsuranceRate: number;   // annual % of home value, e.g. 0.5
  hoaMonthly: number;
  maintenanceRate: number;     // annual % of home value, e.g. 1.0
  closingCostRate: number;     // % of purchase price, e.g. 2.5
  sellingCostRate: number;     // % of sale price, e.g. 6.0
  homeAppreciationRate: number; // annual %, e.g. 3.0

  // Renting inputs
  monthlyRent: number;
  annualRentIncrease: number;  // %, e.g. 3.0
  rentersInsuranceMonthly: number;

  // Common
  yearsToCompare: number;      // 1–30
  investmentReturnRate: number; // annual %, e.g. 7.0 (opportunity cost of down payment)
}

export interface YearlyComparison {
  year: number;
  // Buying
  cumulativeBuyingCost: number;    // total out-of-pocket
  homeEquity: number;
  homeValue: number;
  remainingLoan: number;
  buyingNetCost: number;           // cumulative cost - equity
  // Renting
  cumulativeRentingCost: number;
  investmentValue: number;         // down payment invested
  rentingNetCost: number;          // cumulative rent - investment value
  // Delta
  advantage: 'buy' | 'rent' | 'equal';
  netDifference: number;           // positive = buying is better, negative = renting is better
}

export interface RentVsBuyResult {
  breakEvenYear: number | null;    // null if never
  totalBuyingCost: number;
  totalRentingCost: number;
  buyingNetCost: number;           // total cost - equity at end
  rentingNetCost: number;          // total rent - investment value at end
  finalHomeValue: number;
  finalHomeEquity: number;
  finalInvestmentValue: number;
  monthlyMortgagePI: number;
  monthlyBuyingTotal: number;      // all-in first year
  totalInterestPaid: number;
  yearlyComparison: YearlyComparison[];
}

function pmt(principal: number, monthlyRate: number, n: number): number {
  if (monthlyRate === 0) return principal / n;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
    (Math.pow(1 + monthlyRate, n) - 1)
  );
}

export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const {
    homePrice,
    downPayment,
    mortgageRate,
    loanTermYears,
    propertyTaxRate,
    homeInsuranceRate,
    hoaMonthly,
    maintenanceRate,
    closingCostRate,
    sellingCostRate,
    homeAppreciationRate,
    monthlyRent,
    annualRentIncrease,
    rentersInsuranceMonthly,
    yearsToCompare,
    investmentReturnRate,
  } = input;

  const loanAmount = Math.max(0, homePrice - downPayment);
  const monthlyRate = mortgageRate / 100 / 12;
  const n = loanTermYears * 12;
  const monthlyPI = Math.round(pmt(loanAmount, monthlyRate, n) * 100) / 100;
  const closingCosts = homePrice * closingCostRate / 100;

  const yearlyComparison: YearlyComparison[] = [];

  // ── Buying accumulators ─────────────────────────────────────────────────
  let cumulativeBuyingCost = downPayment + closingCosts; // upfront
  let remainingLoan = loanAmount;
  let totalInterestPaid = 0;

  // ── Renting accumulators ────────────────────────────────────────────────
  let cumulativeRentingCost = 0;
  let currentRent = monthlyRent;
  // Down payment + closing costs invested at opportunity cost rate
  let investmentValue = downPayment + closingCosts;

  let breakEvenYear: number | null = null;
  const monthlyInvestReturn = investmentReturnRate / 100 / 12;

  for (let year = 1; year <= yearsToCompare; year++) {
    // ── Buying: this year's costs ──────────────────────────────────────────
    const homeValueThisYear = homePrice * Math.pow(1 + homeAppreciationRate / 100, year);
    const homeTaxMonthly = homePrice * propertyTaxRate / 100 / 12;  // based on purchase price (simplification)
    const homeInsMonthly = homeValueThisYear * homeInsuranceRate / 100 / 12;
    const maintenanceMonthly = homeValueThisYear * maintenanceRate / 100 / 12;

    let yearBuyingCost = 0;
    for (let m = 0; m < 12; m++) {
      const interestPayment = remainingLoan * monthlyRate;
      const principalPayment = Math.min(remainingLoan, monthlyPI - interestPayment);
      remainingLoan = Math.max(0, remainingLoan - principalPayment);
      totalInterestPaid += interestPayment;

      yearBuyingCost +=
        monthlyPI + homeTaxMonthly + homeInsMonthly + hoaMonthly + maintenanceMonthly;
    }
    cumulativeBuyingCost += yearBuyingCost;

    // Equity = home value - remaining loan - selling costs (if sold this year)
    const sellingCosts = homeValueThisYear * sellingCostRate / 100;
    const homeEquity = Math.max(0, homeValueThisYear - remainingLoan - sellingCosts);
    const buyingNetCost = cumulativeBuyingCost - homeEquity;

    // ── Renting: this year's costs ─────────────────────────────────────────
    if (year > 1) currentRent = currentRent * (1 + annualRentIncrease / 100);

    let yearRentingCost = 0;
    let currentInvestment = investmentValue;
    for (let m = 0; m < 12; m++) {
      yearRentingCost += currentRent + rentersInsuranceMonthly;
      currentInvestment = currentInvestment * (1 + monthlyInvestReturn);
    }
    investmentValue = currentInvestment;
    cumulativeRentingCost += yearRentingCost;

    const rentingNetCost = cumulativeRentingCost - investmentValue;

    const netDifference = rentingNetCost - buyingNetCost; // positive = buying is cheaper
    const advantage: 'buy' | 'rent' | 'equal' =
      Math.abs(netDifference) < 100 ? 'equal' : netDifference > 0 ? 'buy' : 'rent';

    if (breakEvenYear === null && advantage === 'buy') {
      breakEvenYear = year;
    }

    yearlyComparison.push({
      year,
      cumulativeBuyingCost: Math.round(cumulativeBuyingCost),
      homeEquity: Math.round(homeEquity),
      homeValue: Math.round(homeValueThisYear),
      remainingLoan: Math.round(remainingLoan),
      buyingNetCost: Math.round(buyingNetCost),
      cumulativeRentingCost: Math.round(cumulativeRentingCost),
      investmentValue: Math.round(investmentValue),
      rentingNetCost: Math.round(rentingNetCost),
      advantage,
      netDifference: Math.round(netDifference),
    });
  }

  const finalYear = yearlyComparison[yearlyComparison.length - 1];
  const firstYearTaxMonthly = homePrice * propertyTaxRate / 100 / 12;
  const firstYearInsMonthly = homePrice * homeInsuranceRate / 100 / 12;
  const firstYearMaintMonthly = homePrice * maintenanceRate / 100 / 12;

  return {
    breakEvenYear,
    totalBuyingCost: finalYear?.cumulativeBuyingCost ?? 0,
    totalRentingCost: finalYear?.cumulativeRentingCost ?? 0,
    buyingNetCost: finalYear?.buyingNetCost ?? 0,
    rentingNetCost: finalYear?.rentingNetCost ?? 0,
    finalHomeValue: finalYear?.homeValue ?? 0,
    finalHomeEquity: finalYear?.homeEquity ?? 0,
    finalInvestmentValue: Math.round(finalYear?.investmentValue ?? 0),
    monthlyMortgagePI: monthlyPI,
    monthlyBuyingTotal: Math.round(
      (monthlyPI + firstYearTaxMonthly + firstYearInsMonthly + hoaMonthly + firstYearMaintMonthly) * 100,
    ) / 100,
    totalInterestPaid: Math.round(totalInterestPaid),
    yearlyComparison,
  };
}
