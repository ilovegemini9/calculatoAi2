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
