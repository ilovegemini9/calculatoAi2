export interface BoatLoanInput {
  boatPrice: number;
  downPayment: number;
  tradeInValue: number;
  salesTaxRate: number;
  fees: number;
  interestRate: number;
  termYears: number;
}

export interface BoatLoanAmortizationRow {
  year: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

export interface BoatLoanResult {
  taxablePrice: number;
  salesTax: number;
  amountFinanced: number;
  termMonths: number;
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  totalCost: number;
  upfrontCash: number;
  amortization: BoatLoanAmortizationRow[];
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function cents(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function calculateBoatLoan(input: BoatLoanInput): BoatLoanResult {
  const boatPrice = nonNegative(input.boatPrice);
  const downPayment = Math.min(nonNegative(input.downPayment), boatPrice);
  const tradeInValue = Math.min(nonNegative(input.tradeInValue), boatPrice - downPayment);
  const salesTaxRate = nonNegative(input.salesTaxRate);
  const fees = nonNegative(input.fees);
  const annualRate = nonNegative(input.interestRate);
  const termMonths = Math.max(1, Math.round(nonNegative(input.termYears) * 12));
  const taxablePrice = Math.max(0, boatPrice - downPayment - tradeInValue);
  const salesTax = taxablePrice * (salesTaxRate / 100);
  const amountFinanced = taxablePrice + salesTax + fees;
  const monthlyRate = annualRate / 1200;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const monthlyPayment = amountFinanced === 0
    ? 0
    : monthlyRate === 0
      ? amountFinanced / termMonths
      : amountFinanced * (monthlyRate * factor) / (factor - 1);
  const totalPayments = monthlyPayment * termMonths;
  const totalInterest = Math.max(0, totalPayments - amountFinanced);
  const totalCost = downPayment + tradeInValue + totalPayments;
  const amortization: BoatLoanAmortizationRow[] = [];
  let balance = amountFinanced;
  let yearPayment = 0;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let month = 1; month <= termMonths; month += 1) {
    const interest = balance * monthlyRate;
    const principal = Math.min(balance, Math.max(0, monthlyPayment - interest));
    balance = Math.max(0, balance - principal);
    yearPayment += monthlyPayment;
    yearPrincipal += principal;
    yearInterest += interest;
    if (month % 12 === 0 || month === termMonths) {
      amortization.push({
        year: Math.ceil(month / 12),
        payment: cents(yearPayment),
        principalPaid: cents(yearPrincipal),
        interestPaid: cents(yearInterest),
        balance: cents(balance),
      });
      yearPayment = 0;
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  return {
    taxablePrice: cents(taxablePrice),
    salesTax: cents(salesTax),
    amountFinanced: cents(amountFinanced),
    termMonths,
    monthlyPayment: cents(monthlyPayment),
    totalPayments: cents(totalPayments),
    totalInterest: cents(totalInterest),
    totalCost: cents(totalCost),
    upfrontCash: cents(downPayment + tradeInValue),
    amortization,
  };
}
