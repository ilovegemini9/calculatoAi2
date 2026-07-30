// Down Payment Calculator
// How much to save, PMI costs, closing costs, and timeline to purchase

export type LoanType = 'conventional-20' | 'conventional-10' | 'conventional-5' | 'fha' | 'va' | 'usda' | 'custom';

export interface DownPaymentInput {
  homePrice: number;
  loanType: LoanType;
  customDownPct?: number; // used when loanType === 'custom'
  currentSavings: number;
  monthlySavings: number;
  savingsYield: number; // annual % interest on savings (HYSA/etc.)
  closingCostPct?: number; // default 3%
}

export interface DownPaymentResult {
  // Down payment
  downPaymentPct: number;
  downPaymentAmount: number;
  loanAmount: number;

  // PMI
  requiresPmi: boolean;
  estimatedMonthlyPmi: number; // 0.5–1% of loan/year

  // Closing costs
  closingCostPct: number;
  closingCostAmount: number;

  // Total cash needed
  totalCashNeeded: number; // down payment + closing costs
  cashGap: number; // max(0, totalCashNeeded - currentSavings)

  // Timeline
  monthsToGoal: number | null; // null if already have enough
  targetDate: string; // ISO month string (YYYY-MM)

  // LTV
  ltv: number; // %

  // PMI breakeven — when equity hits 20%
  pmiDropMonth: number; // month number when LTV reaches 80%

  // Minimum down payments by type (for reference)
  minDownPcts: Record<LoanType, number>;
}

const MIN_DOWN_PCTS: Record<LoanType, number> = {
  'conventional-20': 20,
  'conventional-10': 10,
  'conventional-5': 5,
  'fha': 3.5,
  'va': 0,
  'usda': 0,
  'custom': 0,
};

export function calculateDownPayment(input: DownPaymentInput): DownPaymentResult {
  const r = (v: number) => Math.round(v * 100) / 100;

  const downPct =
    input.loanType === 'custom'
      ? (input.customDownPct ?? 20)
      : MIN_DOWN_PCTS[input.loanType];

  const downPaymentAmount = r((downPct / 100) * input.homePrice);
  const loanAmount = r(Math.max(0, input.homePrice - downPaymentAmount));
  const ltv = input.homePrice > 0 ? (loanAmount / input.homePrice) * 100 : 0;

  const closingCostPct = input.closingCostPct ?? 3;
  const closingCostAmount = r((closingCostPct / 100) * input.homePrice);
  const totalCashNeeded = r(downPaymentAmount + closingCostAmount);
  const cashGap = r(Math.max(0, totalCashNeeded - input.currentSavings));

  // PMI: required when LTV > 80% (i.e., down payment < 20%) for conventional loans
  const requiresPmi = ltv > 80 && input.loanType !== 'va' && input.loanType !== 'usda';
  // Typical PMI: 0.5–1% of loan per year; use 0.7% as estimate
  const estimatedMonthlyPmi = requiresPmi ? r((loanAmount * 0.007) / 12) : 0;

  // Timeline to save the cash gap
  const monthlyRate = input.savingsYield / 100 / 12;
  let monthsToGoal: number | null = null;
  let targetDate = '';

  if (cashGap <= 0) {
    monthsToGoal = null;
    targetDate = new Date().toISOString().slice(0, 7);
  } else if (input.monthlySavings <= 0) {
    monthsToGoal = null;
    targetDate = '';
  } else {
    // Future value of annuity: FV = PMT × [(1+r)^n − 1] / r
    // Solve for n: n = ln(FV × r / PMT + 1) / ln(1 + r)
    let months: number;
    if (monthlyRate === 0) {
      months = cashGap / input.monthlySavings;
    } else {
      months = Math.log((cashGap * monthlyRate) / input.monthlySavings + 1) / Math.log(1 + monthlyRate);
    }
    monthsToGoal = Math.ceil(months);
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToGoal);
    targetDate = d.toISOString().slice(0, 7);
  }

  // PMI drop month: when balance reaches 80% LTV
  // Rough estimate assuming 30-yr fixed at current national avg ~6.85%
  // We use a simplified approach: find month where equity > 20%
  // For this calculator we'll estimate based purely on down payment overage
  const pmiDropMonth = requiresPmi
    ? Math.max(0, Math.ceil(((ltv - 80) / 100) * input.homePrice / (downPaymentAmount / Math.max(downPct, 1))))
    : 0;

  return {
    downPaymentPct: Math.round(downPct * 100) / 100,
    downPaymentAmount,
    loanAmount,
    requiresPmi,
    estimatedMonthlyPmi,
    closingCostPct,
    closingCostAmount,
    totalCashNeeded,
    cashGap: r(cashGap),
    monthsToGoal,
    targetDate,
    ltv: Math.round(ltv * 10) / 10,
    pmiDropMonth,
    minDownPcts: MIN_DOWN_PCTS,
  };
}
