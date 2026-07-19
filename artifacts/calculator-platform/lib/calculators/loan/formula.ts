export interface LoanInput {
  loanAmount: number;
  interestRate: number; // annual, e.g. 5.5
  term: number;
  termUnit: 'years' | 'months';
}

export interface AmortizationRow {
  paymentNumber: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  totalCost: number;
  amortization: AmortizationRow[];
}

export function calculateLoan(input: LoanInput): LoanResult {
  const totalMonths = input.termUnit === 'years' ? input.term * 12 : input.term;
  const monthlyRate = input.interestRate / 100 / 12;

  const monthlyPayment =
    monthlyRate === 0
      ? input.loanAmount / totalMonths
      : (input.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const amortization: AmortizationRow[] = [];
  let remainingBalance = input.loanAmount;
  let totalInterest = 0;

  for (let i = 1; i <= totalMonths; i++) {
    const interestPaid = remainingBalance * monthlyRate;
    const principalPaid = i === totalMonths ? remainingBalance : monthlyPayment - interestPaid;

    remainingBalance -= principalPaid;
    if (remainingBalance < 0) remainingBalance = 0;
    totalInterest += interestPaid;

    amortization.push({
      paymentNumber: i,
      payment: Math.round(monthlyPayment * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      interestPaid: Math.round(interestPaid * 100) / 100,
      balance: Math.round(remainingBalance * 100) / 100,
    });
  }

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPrincipal: Math.round(input.loanAmount * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round((input.loanAmount + totalInterest) * 100) / 100,
    amortization,
  };
}
