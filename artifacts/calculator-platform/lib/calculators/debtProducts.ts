export interface PayoffResult { balance: number; monthlyPayment: number; payments: number; totalPayments: number; totalInterest: number; status: 'payable' | 'payment-too-low' | 'no-balance' }
function nn(v: number) { return Number.isFinite(v) ? Math.max(0, v) : 0; }
function money(v: number) { return Math.round((Number.isFinite(v) ? v : 0) * 100) / 100; }
export function simulatePayoff(balanceInput: number, aprInput: number, paymentInput: number): PayoffResult {
  const balance = nn(balanceInput); const apr = nn(aprInput); const payment = nn(paymentInput); const r = apr / 1200;
  if (balance === 0) return { balance: 0, monthlyPayment: payment, payments: 0, totalPayments: 0, totalInterest: 0, status: 'no-balance' };
  if (payment <= 0 || (r > 0 && payment <= balance * r)) return { balance: money(balance), monthlyPayment: money(payment), payments: 0, totalPayments: 0, totalInterest: 0, status: 'payment-too-low' };
  let remaining = balance; let totalInterest = 0; let totalPayments = 0; let months = 0;
  while (remaining > 0.005 && months < 1200) { months += 1; const interest = remaining * r; const paid = Math.min(payment, remaining + interest); remaining = Math.max(0, remaining - Math.max(0, paid - interest)); totalInterest += interest; totalPayments += paid; }
  return { balance: money(balance), monthlyPayment: money(payment), payments: months, totalPayments: money(totalPayments), totalInterest: money(totalInterest), status: 'payable' };
}
export interface CreditCardResult extends PayoffResult { minimumPayment: number; minimumFloor: number }
export function calculateCreditCard(balance: number, apr: number, minimumPercent: number, minimumFloor: number): CreditCardResult {
  const b = nn(balance); const floor = nn(minimumFloor); const percent = nn(minimumPercent) / 100; const firstPayment = Math.max(floor, b * percent); const payoff = simulatePayoff(b, apr, firstPayment);
  return { ...payoff, minimumPayment: money(firstPayment), minimumFloor: money(floor) };
}
export interface MultiCardInput { card1: { balance: number; apr: number; payment: number }; card2: { balance: number; apr: number; payment: number }; card3: { balance: number; apr: number; payment: number } }
export interface MultiCardResult { totalBalance: number; totalPayment: number; payoffMonths: number; totalInterest: number; cards: PayoffResult[] }
export function calculateCreditCardsPayoff(input: MultiCardInput): MultiCardResult {
  const cards = [input.card1, input.card2, input.card3].map((c) => simulatePayoff(c.balance, c.apr, c.payment));
  return { totalBalance: money(cards.reduce((s, c) => s + c.balance, 0)), totalPayment: money(cards.reduce((s, c) => s + c.monthlyPayment, 0)), payoffMonths: Math.max(0, ...cards.map((c) => c.payments)), totalInterest: money(cards.reduce((s, c) => s + c.totalInterest, 0)), cards };
}
export interface ConsolidationResult { currentPayment: number; newPayment: number; monthlySavings: number; currentInterest: number; newInterest: number; totalNewCost: number; status: 'payable' | 'payment-too-low' | 'no-balance' }
export function calculateDebtConsolidation(balance: number, currentApr: number, currentPayment: number, newApr: number, termYears: number, fees: number): ConsolidationResult {
  const b = nn(balance); const old = simulatePayoff(b, currentApr, currentPayment); const r = nn(newApr) / 1200; const n = Math.max(1, Math.round(nn(termYears) * 12)); const fee = nn(fees); const p = b + fee; const factor = Math.pow(1 + r, n); const newPayment = p === 0 ? 0 : r === 0 ? p / n : p * (r * factor) / (factor - 1); const newInterest = Math.max(0, newPayment * n - p);
  return { currentPayment: money(old.monthlyPayment), newPayment: money(newPayment), monthlySavings: money(Math.max(0, old.monthlyPayment - newPayment)), currentInterest: money(old.totalInterest), newInterest: money(newInterest), totalNewCost: money(p + newInterest), status: old.status };
}
export interface DtiResult { grossMonthlyIncome: number; monthlyDebt: number; dti: number; proposedDti: number; headroom: number; status: 'within-range' | 'high' }
export function calculateDti(income: number, debt: number, housing: number, proposed: number): DtiResult {
  const gross = nn(income); const monthlyDebt = nn(debt) + nn(housing); const proposedDebt = monthlyDebt + nn(proposed); const dti = gross === 0 ? 0 : monthlyDebt / gross * 100; const proposedDti = gross === 0 ? 0 : proposedDebt / gross * 100;
  return { grossMonthlyIncome: money(gross), monthlyDebt: money(monthlyDebt), dti: Math.round(dti * 10) / 10, proposedDti: Math.round(proposedDti * 10) / 10, headroom: Math.round(Math.max(0, 36 - proposedDti) * 10) / 10, status: proposedDti <= 36 ? 'within-range' : 'high' };
}
