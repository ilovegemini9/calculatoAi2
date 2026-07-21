// UK Mortgage Calculator
// Includes Stamp Duty Land Tax (SDLT), LTV, arrangement fees, repayment vs interest-only

export type RepaymentType = 'repayment' | 'interest-only';
export type BuyerType = 'first-time' | 'home-mover' | 'additional-property';

export interface MortgageUkInput {
  propertyValue: number; // £
  deposit: number; // £
  interestRate: number; // annual %, e.g. 4.5
  mortgageTermYears: number; // e.g. 25
  repaymentType: RepaymentType;
  buyerType: BuyerType;
  arrangementFee?: number; // £, added to loan if rolled in, default 0
  rollArrangementFee?: boolean; // default false
}

export interface StampDutyBand {
  from: number;
  to: number;
  rate: number;
  tax: number;
}

export interface MortgageUkResult {
  // Loan
  loanAmount: number; // £ deposit taken off, arrangement fee optionally added
  ltv: number; // %
  isHighLtv: boolean; // LTV > 90%

  // Monthly payment
  monthlyPayment: number; // P&I for repayment, interest-only for IO
  monthlyInterestOnly: number; // always shown for reference

  // Total cost
  totalMonthlyPayments: number;
  totalInterestPaid: number;
  totalCostOfMortgage: number; // loan + total interest

  // Stamp Duty (SDLT — England & NI rates)
  stampDutyBands: StampDutyBand[];
  totalStampDuty: number;

  // Grand total (mortgage cost + stamp duty + arrangement fee if upfront)
  totalPurchaseCost: number; // property value + stamp duty + upfront arrangement fee
}

/** England & Northern Ireland SDLT bands */
function calcStampDuty(propertyValue: number, buyerType: BuyerType): { bands: StampDutyBand[]; total: number } {
  // Additional property: +3% surcharge on every band
  const surcharge = buyerType === 'additional-property' ? 0.03 : 0;

  let thresholds: Array<{ from: number; to: number; rate: number }>;

  if (buyerType === 'first-time') {
    // First-time buyer relief (effective from Sept 2022, reviewed periodically)
    // 0%: £0–£425,000; 5%: £425,001–£625,000; standard above £625k
    if (propertyValue <= 625_000) {
      thresholds = [
        { from: 0,       to: 425_000, rate: 0.00 },
        { from: 425_000, to: 625_000, rate: 0.05 },
      ];
    } else {
      // Standard rates apply when price > £625k
      thresholds = [
        { from: 0,         to: 250_000,   rate: 0.00 },
        { from: 250_000,   to: 925_000,   rate: 0.05 },
        { from: 925_000,   to: 1_500_000, rate: 0.10 },
        { from: 1_500_000, to: Infinity,  rate: 0.12 },
      ];
    }
  } else {
    // Standard / additional-property
    thresholds = [
      { from: 0,         to: 250_000,   rate: 0.00 + surcharge },
      { from: 250_000,   to: 925_000,   rate: 0.05 + surcharge },
      { from: 925_000,   to: 1_500_000, rate: 0.10 + surcharge },
      { from: 1_500_000, to: Infinity,  rate: 0.12 + surcharge },
    ];
  }

  const bands: StampDutyBand[] = [];
  let total = 0;

  for (const { from, to, rate } of thresholds) {
    if (propertyValue <= from) break;
    const taxableAmount = Math.min(propertyValue, to) - from;
    const tax = taxableAmount * rate;
    total += tax;
    bands.push({ from, to: Math.min(propertyValue, to), rate, tax: Math.round(tax * 100) / 100 });
  }

  return { bands, total: Math.round(total * 100) / 100 };
}

export function calculateMortgageUk(input: MortgageUkInput): MortgageUkResult {
  const r = (v: number) => Math.round(v * 100) / 100;

  const arrangementFee = input.arrangementFee ?? 0;
  const rollFee = input.rollArrangementFee ?? false;

  const baseLoan = Math.max(0, input.propertyValue - input.deposit);
  const loanAmount = rollFee ? baseLoan + arrangementFee : baseLoan;
  const ltv = input.propertyValue > 0 ? (loanAmount / input.propertyValue) * 100 : 0;
  const isHighLtv = ltv > 90;

  const monthlyRate = input.interestRate / 100 / 12;
  const n = input.mortgageTermYears * 12;

  const monthlyInterestOnly = r(loanAmount * monthlyRate);

  let monthlyPayment: number;
  if (input.repaymentType === 'interest-only') {
    monthlyPayment = monthlyInterestOnly;
  } else {
    // Repayment (capital + interest)
    monthlyPayment =
      loanAmount === 0
        ? 0
        : monthlyRate === 0
          ? loanAmount / n
          : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, n)) /
            (Math.pow(1 + monthlyRate, n) - 1);
  }

  const totalMonthlyPayments = r(monthlyPayment * n);
  const totalInterestPaid =
    input.repaymentType === 'interest-only'
      ? r(monthlyInterestOnly * n) // IO: you still owe full capital at end
      : r(Math.max(0, totalMonthlyPayments - loanAmount));

  const totalCostOfMortgage = r(
    input.repaymentType === 'interest-only'
      ? totalMonthlyPayments + loanAmount // capital repaid in lump sum at end
      : totalMonthlyPayments
  );

  // Stamp duty
  const { bands: stampDutyBands, total: totalStampDuty } = calcStampDuty(input.propertyValue, input.buyerType);

  // Grand total: property + SDLT + upfront arrangement fee (if not rolled)
  const totalPurchaseCost = r(
    input.propertyValue + totalStampDuty + (rollFee ? 0 : arrangementFee)
  );

  return {
    loanAmount: r(loanAmount),
    ltv: Math.round(ltv * 10) / 10,
    isHighLtv,
    monthlyPayment: r(monthlyPayment),
    monthlyInterestOnly,
    totalMonthlyPayments,
    totalInterestPaid,
    totalCostOfMortgage,
    stampDutyBands,
    totalStampDuty,
    totalPurchaseCost,
  };
}
