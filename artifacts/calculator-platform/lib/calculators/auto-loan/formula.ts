/**
 * Auto Loan Calculator Formula
 *
 * Computes the actual financed amount after trade-in, down payment,
 * and sales tax/dealer fees, then applies standard monthly amortization.
 */

export interface AutoLoanInput {
  vehiclePrice: number;    // selling price
  downPayment: number;
  tradeInValue: number;    // trade-in equity (amount applied toward purchase)
  salesTaxRate: number;    // % applied to (vehicle price - trade-in), e.g. 8.5
  dealerFees: number;      // doc, title, registration fees
  annualRate: number;      // APR, e.g. 6.9
  termMonths: number;      // 24, 36, 48, 60, 72, 84
}

export interface AutoLoanAmortizationRow {
  paymentNumber: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

export interface AutoLoanResult {
  vehiclePrice: number;
  taxAmount: number;
  totalVehicleCost: number;   // price + tax + fees
  amountFinanced: number;     // total cost - down - trade-in
  monthlyPayment: number;
  totalInterest: number;
  totalLoanCost: number;      // financed + interest
  totalOutOfPocket: number;   // down + trade-in + total loan payments
  amortization: AutoLoanAmortizationRow[];
}

export function calculateAutoLoan(input: AutoLoanInput): AutoLoanResult {
  const { vehiclePrice, downPayment, tradeInValue, salesTaxRate, dealerFees, annualRate, termMonths } = input;

  // Tax is assessed on (vehicle price minus trade-in value) in most US states
  const taxableBase = Math.max(0, vehiclePrice - tradeInValue);
  const taxAmount = taxableBase * (salesTaxRate / 100);
  const totalVehicleCost = vehiclePrice + taxAmount + dealerFees;
  const amountFinanced = Math.max(0, totalVehicleCost - downPayment - tradeInValue);

  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? amountFinanced / termMonths
      : (amountFinanced * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  const amortization: AutoLoanAmortizationRow[] = [];
  let balance = amountFinanced;
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

  const totalLoanCost = Math.round((amountFinanced + totalInterest) * 100) / 100;
  const totalOutOfPocket = Math.round((downPayment + monthlyPayment * termMonths) * 100) / 100;

  return {
    vehiclePrice: Math.round(vehiclePrice * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    totalVehicleCost: Math.round(totalVehicleCost * 100) / 100,
    amountFinanced: Math.round(amountFinanced * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalLoanCost,
    totalOutOfPocket,
    amortization,
  };
}
