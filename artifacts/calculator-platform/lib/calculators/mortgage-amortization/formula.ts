export interface MortgageAmortizationInput {
  loanAmount: number;
  interestRate: number;    // annual %, e.g. 6.85
  loanTermYears: number;
  extraMonthlyPayment?: number;
}

export interface AmortizationRow {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  extraPrincipal: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface YearlySummary {
  year: number;
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  endingBalance: number;
  cumulativeInterest: number;
}

export interface MortgageAmortizationResult {
  monthlyPayment: number;           // base P&I (without extra)
  totalMonthlyPayment: number;      // base + extra
  totalInterest: number;
  totalPaid: number;
  payoffMonths: number;             // actual payoff — may be < loanTermYears*12 if extra payments
  interestSaved: number;            // vs no extra payments
  monthsSaved: number;
  schedule: AmortizationRow[];
  yearlySummary: YearlySummary[];
}

export function calculateMortgageAmortization(
  input: MortgageAmortizationInput,
): MortgageAmortizationResult {
  const { loanAmount, interestRate, loanTermYears } = input;
  const extra = input.extraMonthlyPayment ?? 0;
  const monthlyRate = interestRate / 100 / 12;
  const n = loanTermYears * 12;

  // Standard PMT
  const baseMonthlyPayment =
    monthlyRate === 0
      ? loanAmount / n
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1);

  // Total interest without extra payments (for savings comparison)
  const totalInterestNoExtra = Math.round((baseMonthlyPayment * n - loanAmount) * 100) / 100;

  // Build schedule with extra payments
  const schedule: AmortizationRow[] = [];
  const yearlySummaryMap: Map<number, YearlySummary> = new Map();

  let balance = loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let month = 1; month <= n && balance > 0.005; month++) {
    const year = Math.ceil(month / 12);
    const interestPayment = Math.round(balance * monthlyRate * 100) / 100;
    let principalPayment = Math.round((baseMonthlyPayment - interestPayment) * 100) / 100;

    // Extra payment — cannot exceed remaining balance
    const extraApplied = Math.min(extra, Math.max(0, balance - principalPayment));

    // Last payment adjustment
    if (principalPayment > balance) principalPayment = balance;

    balance = Math.round((balance - principalPayment - extraApplied) * 100) / 100;
    if (balance < 0) balance = 0;

    cumulativeInterest = Math.round((cumulativeInterest + interestPayment) * 100) / 100;
    cumulativePrincipal = Math.round((cumulativePrincipal + principalPayment + extraApplied) * 100) / 100;

    const row: AmortizationRow = {
      month,
      year,
      payment: Math.round((principalPayment + interestPayment + extraApplied) * 100) / 100,
      principal: principalPayment,
      interest: interestPayment,
      extraPrincipal: extraApplied,
      balance,
      cumulativeInterest,
      cumulativePrincipal,
    };
    schedule.push(row);

    // Accumulate yearly
    if (!yearlySummaryMap.has(year)) {
      yearlySummaryMap.set(year, {
        year,
        totalPayment: 0,
        totalPrincipal: 0,
        totalInterest: 0,
        endingBalance: 0,
        cumulativeInterest: 0,
      });
    }
    const ys = yearlySummaryMap.get(year)!;
    ys.totalPayment = Math.round((ys.totalPayment + row.payment) * 100) / 100;
    ys.totalPrincipal = Math.round((ys.totalPrincipal + row.principal + row.extraPrincipal) * 100) / 100;
    ys.totalInterest = Math.round((ys.totalInterest + row.interest) * 100) / 100;
    ys.endingBalance = balance;
    ys.cumulativeInterest = cumulativeInterest;
  }

  const yearlySummary = Array.from(yearlySummaryMap.values());
  const payoffMonths = schedule.length;
  const totalInterest = cumulativeInterest;
  const totalPaid = Math.round((loanAmount + totalInterest) * 100) / 100;

  return {
    monthlyPayment: Math.round(baseMonthlyPayment * 100) / 100,
    totalMonthlyPayment: Math.round((baseMonthlyPayment + extra) * 100) / 100,
    totalInterest,
    totalPaid,
    payoffMonths,
    interestSaved: Math.round((totalInterestNoExtra - totalInterest) * 100) / 100,
    monthsSaved: n - payoffMonths,
    schedule,
    yearlySummary,
  };
}
