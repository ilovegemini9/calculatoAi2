export interface MortgageInput {
  homePrice: number;
  downPayment: number; // in dollars
  interestRate: number; // annual percentage, e.g. 6.85
  loanTermYears: number; // e.g. 30
  propertyTaxRate?: number; // annual percentage of home value, e.g. 1.2%
  homeInsuranceAnnual?: number; // dollar amount, e.g. 1200
  hoaMonthly?: number; // e.g. 150
}

export interface AmortizationRow {
  paymentNumber: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface MortgageResult {
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  totalMonthlyPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  totalCost: number;
  amortizationSchedule: AmortizationRow[];
}

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const principalAmount = Math.max(0, input.homePrice - input.downPayment);
  const monthlyRate = (input.interestRate / 100) / 12;
  const numberOfPayments = input.loanTermYears * 12;

  let monthlyPAndI = 0;
  if (monthlyRate === 0) {
    monthlyPAndI = principalAmount / numberOfPayments;
  } else {
    monthlyPAndI = (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                   (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  }

  const monthlyPropertyTax = ((input.propertyTaxRate || 0) / 100 * input.homePrice) / 12;
  const monthlyInsurance = (input.homeInsuranceAnnual || 0) / 12;
  const monthlyHoa = input.hoaMonthly || 0;
  const totalMonthlyPayment = monthlyPAndI + monthlyPropertyTax + monthlyInsurance + monthlyHoa;

  const amortizationSchedule: AmortizationRow[] = [];
  let remainingBalance = principalAmount;
  let totalInterestPaid = 0;

  for (let i = 1; i <= numberOfPayments; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    let principalPayment = monthlyPAndI - interestPayment;

    if (i === numberOfPayments) {
      principalPayment = remainingBalance;
    }

    remainingBalance -= principalPayment;
    if (remainingBalance < 0) remainingBalance = 0;

    totalInterestPaid += interestPayment;

    // Only save a condensed version for performance and responsiveness (e.g. yearly, or first few and end)
    // Actually, saving all of them is fine but let's save all rows for accurate calculations,
    // and we can display them nicely grouped or paginated.
    amortizationSchedule.push({
      paymentNumber: i,
      payment: monthlyPAndI,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100
    });
  }

  return {
    monthlyPrincipalAndInterest: Math.round(monthlyPAndI * 100) / 100,
    monthlyPropertyTax: Math.round(monthlyPropertyTax * 100) / 100,
    monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
    monthlyHoa: Math.round(monthlyHoa * 100) / 100,
    totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
    totalPrincipal: Math.round(principalAmount * 100) / 100,
    totalInterest: Math.round(totalInterestPaid * 100) / 100,
    totalCost: Math.round((principalAmount + totalInterestPaid) * 100) / 100,
    amortizationSchedule
  };
}
