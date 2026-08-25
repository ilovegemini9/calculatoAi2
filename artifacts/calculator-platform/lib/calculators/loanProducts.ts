export interface InstallmentRow { period: number; payment: number; principal: number; interest: number; balance: number }

function finiteNonNegative(value: number): number { return Number.isFinite(value) ? Math.max(0, value) : 0; }
function cents(value: number): number { return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100; }

export interface PaymentInput { principal: number; annualRate: number; termYears: number; fees: number }
export interface PaymentResult { principal: number; financedAmount: number; termMonths: number; monthlyPayment: number; totalInterest: number; totalCost: number; amortization: InstallmentRow[] }
export function calculatePayment(input: PaymentInput): PaymentResult {
  const principal = finiteNonNegative(input.principal); const fees = finiteNonNegative(input.fees); const financedAmount = principal + fees;
  const termMonths = Math.max(1, Math.round(finiteNonNegative(input.termYears) * 12)); const annualRate = finiteNonNegative(input.annualRate); const r = annualRate / 1200;
  const factor = Math.pow(1 + r, termMonths);
  const monthlyPayment = financedAmount === 0 ? 0 : r === 0 ? financedAmount / termMonths : financedAmount * (r * factor) / (factor - 1);
  return buildInstallmentResult(principal, financedAmount, termMonths, monthlyPayment, r);
}

function buildInstallmentResult(principal: number, financedAmount: number, termMonths: number, scheduledPayment: number, monthlyRate: number): PaymentResult {
  const rows: InstallmentRow[] = []; let balance = financedAmount; let totalInterest = 0;
  for (let period = 1; period <= termMonths; period += 1) {
    const interest = balance * monthlyRate; const payment = Math.min(scheduledPayment, balance + interest); const principalPaid = Math.min(balance, Math.max(0, payment - interest)); balance = Math.max(0, balance - principalPaid); totalInterest += interest;
    rows.push({ period, payment: cents(payment), principal: cents(principalPaid), interest: cents(interest), balance: cents(balance) });
  }
  return { principal: cents(principal), financedAmount: cents(financedAmount), termMonths, monthlyPayment: cents(scheduledPayment), totalInterest: cents(totalInterest), totalCost: cents(financedAmount + totalInterest), amortization: rows };
}
function estimateMonthlyRate(principal: number, months: number, payment: number): number {
  if (payment * months <= principal + 0.000001) return 0;
  let low = 0; let high = 1;
  for (let i = 0; i < 80; i += 1) { const mid = (low + high) / 2; const factor = Math.pow(1 + mid, months); const projected = principal * (mid * factor) / (factor - 1); if (projected > payment) high = mid; else low = mid; }
  return (low + high) / 2;
}

export interface RepaymentInput { balance: number; annualRate: number; monthlyPayment: number }
export interface RepaymentResult { balance: number; monthlyRate: number; monthlyPayment: number; payments: number; totalPayments: number; totalInterest: number; status: 'payable' | 'payment-too-low' | 'no-balance'; amortization: InstallmentRow[] }
export function calculateRepayment(input: RepaymentInput): RepaymentResult {
  const balance = finiteNonNegative(input.balance); const monthlyRate = finiteNonNegative(input.annualRate) / 1200; const monthlyPayment = finiteNonNegative(input.monthlyPayment);
  if (balance === 0) return { balance: 0, monthlyRate, monthlyPayment, payments: 0, totalPayments: 0, totalInterest: 0, status: 'no-balance', amortization: [] };
  if (monthlyPayment <= 0 || (monthlyPayment <= balance * monthlyRate && monthlyRate > 0)) return { balance: cents(balance), monthlyRate, monthlyPayment: cents(monthlyPayment), payments: 0, totalPayments: 0, totalInterest: 0, status: 'payment-too-low', amortization: [] };
  const rows: InstallmentRow[] = []; let remaining = balance; let totalPayments = 0; let totalInterest = 0; let period = 0;
  while (remaining > 0.005 && period < 1200) { period += 1; const interest = remaining * monthlyRate; const payment = Math.min(monthlyPayment, remaining + interest); const principalPaid = Math.min(remaining, Math.max(0, payment - interest)); remaining = Math.max(0, remaining - principalPaid); totalPayments += payment; totalInterest += interest; if (period <= 120 || period % 12 === 0 || remaining === 0) rows.push({ period, payment: cents(payment), principal: cents(principalPaid), interest: cents(interest), balance: cents(remaining) }); }
  return { balance: cents(balance), monthlyRate, monthlyPayment: cents(monthlyPayment), payments: period, totalPayments: cents(totalPayments), totalInterest: cents(totalInterest), status: 'payable', amortization: rows };
}

export interface StudentLoanInput { principal: number; annualRate: number; termYears: number; originationFeeRate: number; extraMonthlyPayment: number }
export interface StudentLoanResult extends PaymentResult { originationFee: number; extraMonthlyPayment: number; scheduledPayment: number; payoffMonths: number; interestSaved: number }
export function calculateStudentLoan(input: StudentLoanInput): StudentLoanResult {
  const principal = finiteNonNegative(input.principal); const fee = principal * finiteNonNegative(input.originationFeeRate) / 100; const base = calculatePayment({ principal, annualRate: input.annualRate, termYears: input.termYears, fees: fee }); const extra = finiteNonNegative(input.extraMonthlyPayment); const rate = finiteNonNegative(input.annualRate) / 1200; let balance = base.financedAmount; let totalInterest = 0; let totalPayments = 0; let month = 0; const rows: InstallmentRow[] = [];
  while (balance > 0.005 && month < 1200) { month += 1; const interest = balance * rate; const payment = Math.min(base.monthlyPayment + extra, balance + interest); const principalPaid = Math.min(balance, Math.max(0, payment - interest)); balance = Math.max(0, balance - principalPaid); totalInterest += interest; totalPayments += payment; if (month <= 120 || month % 12 === 0 || balance === 0) rows.push({ period: month, payment: cents(payment), principal: cents(principalPaid), interest: cents(interest), balance: cents(balance) }); }
  return { ...base, originationFee: cents(fee), extraMonthlyPayment: cents(extra), scheduledPayment: base.monthlyPayment, payoffMonths: month, monthlyPayment: cents(base.monthlyPayment + extra), totalInterest: cents(totalInterest), totalCost: cents(totalPayments), amortization: rows, interestSaved: cents(Math.max(0, base.totalInterest - totalInterest)) };
}

export interface CollegeCostInput { annualCost: number; inflationRate: number; yearsUntilCollege: number; currentSavings: number; annualContribution: number; contributionGrowthRate: number }
export interface CollegeCostResult { annualCost: number; futureAnnualCost: number; totalFutureCost: number; futureSavings: number; fundingGap: number; savingsGrowth: number }
export function calculateCollegeCost(input: CollegeCostInput): CollegeCostResult {
  const annualCost = finiteNonNegative(input.annualCost); const inflation = finiteNonNegative(input.inflationRate) / 100; const years = Math.round(finiteNonNegative(input.yearsUntilCollege)); const savings = finiteNonNegative(input.currentSavings); const contribution = finiteNonNegative(input.annualContribution); const contributionGrowth = finiteNonNegative(input.contributionGrowthRate) / 100;
  const futureAnnualCost = annualCost * Math.pow(1 + inflation, years); const totalFutureCost = futureAnnualCost * 4; let futureSavings = savings; for (let year = 0; year < years; year += 1) futureSavings = futureSavings * (1 + inflation) + contribution * Math.pow(1 + contributionGrowth, year); const fundingGap = Math.max(0, totalFutureCost - futureSavings);
  return { annualCost: cents(annualCost), futureAnnualCost: cents(futureAnnualCost), totalFutureCost: cents(totalFutureCost), futureSavings: cents(futureSavings), fundingGap: cents(fundingGap), savingsGrowth: cents(Math.max(0, futureSavings - savings - contribution * years)) };
}
