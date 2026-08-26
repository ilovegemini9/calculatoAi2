export interface EmergencyFundResult {
  targetAmount: number;
  savingsGap: number;
  monthsToGoal: number | null;
  currentCoverageMonths: number;
  error?: string;
}

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function emergencyFund(monthlyExpenses: number, targetMonths: number, currentSavings: number, monthlyContribution: number): EmergencyFundResult {
  const expenses = nonNegative(monthlyExpenses);
  const months = nonNegative(targetMonths);
  const savings = nonNegative(currentSavings);
  const contribution = nonNegative(monthlyContribution);
  if (expenses <= 0 || months <= 0) return { targetAmount: 0, savingsGap: 0, monthsToGoal: 0, currentCoverageMonths: 0, error: 'Enter positive monthly expenses and a positive target month count.' };
  const targetAmount = expenses * months;
  const savingsGap = Math.max(0, targetAmount - savings);
  const monthsToGoal = savingsGap === 0 ? 0 : contribution > 0 ? Math.ceil(savingsGap / contribution) : null;
  return { targetAmount, savingsGap, monthsToGoal, currentCoverageMonths: savings / expenses };
}

export type CagrMode = 'cagr' | 'future-value' | 'initial-value';

export function calculateCagr(mode: CagrMode, initialValue: number, finalValue: number, years: number, annualRatePercent = 0) {
  const initial = nonNegative(initialValue);
  const final = nonNegative(finalValue);
  const period = nonNegative(years);
  const rate = annualRatePercent / 100;
  if (period <= 0) return { result: 0, totalGrowthPercent: 0, error: 'Enter a positive number of years.' };
  if (mode === 'cagr') {
    if (initial <= 0 || final <= 0) return { result: 0, totalGrowthPercent: 0, error: 'Initial and final values must be positive for CAGR.' };
    const cagrRate = (final / initial) ** (1 / period) - 1;
    return { result: cagrRate * 100, totalGrowthPercent: (final / initial - 1) * 100 };
  }
  if (!Number.isFinite(rate) || rate <= -1) return { result: 0, totalGrowthPercent: 0, error: 'Annual rate must be greater than -100%.' };
  if (mode === 'future-value') {
    if (initial <= 0) return { result: 0, totalGrowthPercent: 0, error: 'Initial value must be positive.' };
    const future = initial * (1 + rate) ** period;
    return { result: future, totalGrowthPercent: (future / initial - 1) * 100 };
  }
  if (final <= 0) return { result: 0, totalGrowthPercent: 0, error: 'Final value must be positive.' };
  const present = final / (1 + rate) ** period;
  return { result: present, totalGrowthPercent: (final / present - 1) * 100 };
}

export function loanToValue(loanAmount: number, propertyValue: number, secondLien = 0) {
  const loan = nonNegative(loanAmount);
  const property = nonNegative(propertyValue);
  const second = nonNegative(secondLien);
  if (property <= 0) return { ltvPercent: 0, cltvPercent: 0, equityAmount: 0, equityPercent: 0, error: 'Enter a positive property value.' };
  const ltvPercent = loan / property * 100;
  const cltvPercent = (loan + second) / property * 100;
  return { ltvPercent, cltvPercent, equityAmount: property - loan, equityPercent: 100 - ltvPercent };
}

export function splitBill(totalBill: number, tipPercent: number, people: number, serviceCharge: number) {
  const bill = nonNegative(totalBill);
  const tipRate = nonNegative(tipPercent);
  const diners = Math.max(1, Math.trunc(nonNegative(people)));
  const service = nonNegative(serviceCharge);
  const adjustedBill = bill + service;
  const tipAmount = adjustedBill * tipRate / 100;
  const grandTotal = adjustedBill + tipAmount;
  return { adjustedBill, tipAmount, grandTotal, perPerson: grandTotal / diners, people: diners };
}
