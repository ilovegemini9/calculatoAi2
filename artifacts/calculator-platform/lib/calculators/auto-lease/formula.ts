/**
 * Auto Lease Calculator Formula
 *
 * Lease payment = Monthly Depreciation + Monthly Finance Charge
 * where:
 *   Monthly Depreciation = (Adjusted Cap Cost − Residual Value) / Lease Term
 *   Monthly Finance Charge = (Adjusted Cap Cost + Residual Value) × Money Factor
 *   Sales tax is applied to total monthly payment (varies by state; common method).
 *
 * Money Factor ≈ APR / 2400  (to convert APR → money factor and vice-versa).
 */

export interface AutoLeaseInput {
  msrp: number;              // manufacturer's suggested retail price
  negotiatedPrice: number;   // agreed selling/cap cost price
  downPayment: number;       // cap cost reduction (cash down)
  tradeInValue: number;      // trade-in equity reducing cap cost
  acquisitionFee: number;    // dealer/lender acquisition fee (added to cap cost)
  residualPct: number;       // residual value as % of MSRP, e.g. 55
  moneyFactor: number;       // e.g. 0.00125  (= APR 3%)
  leaseTermMonths: number;   // 24, 36, 39, 48
  salesTaxRate: number;      // % applied to monthly payment
  annualMileage: number;     // included miles per year
  excessMileageRate: number; // $/mile charge over limit, e.g. 0.25
}

export interface AutoLeaseResult {
  adjustedCapCost: number;    // negotiated + acq fee − down − trade-in
  residualValue: number;      // MSRP × residualPct / 100
  monthlyDepreciation: number;
  monthlyFinanceCharge: number;
  monthlyPaymentPreTax: number;
  monthlyTax: number;
  monthlyPayment: number;     // total incl. tax
  totalLeasePayments: number; // monthly × term
  totalDueAtSigning: number;  // down + first payment + acq fee (if not rolled in)
  effectiveApr: number;       // money factor × 2400
  totalMileageAllowance: number;
  perMileOverageCharge: number;
  // Cost-to-own comparison helpers
  totalCostToLease: number;   // down + all payments
  vsFinanceNote: string;
}

export function calculateAutoLease(input: AutoLeaseInput): AutoLeaseResult {
  const {
    msrp, negotiatedPrice, downPayment, tradeInValue, acquisitionFee,
    residualPct, moneyFactor, leaseTermMonths, salesTaxRate,
    annualMileage, excessMileageRate,
  } = input;

  // Adjusted capitalised cost
  const adjustedCapCost = negotiatedPrice + acquisitionFee - downPayment - tradeInValue;

  // Residual value
  const residualValue = msrp * (residualPct / 100);

  // Monthly depreciation component
  const monthlyDepreciation = (adjustedCapCost - residualValue) / leaseTermMonths;

  // Monthly finance charge component
  const monthlyFinanceCharge = (adjustedCapCost + residualValue) * moneyFactor;

  const monthlyPaymentPreTax = monthlyDepreciation + monthlyFinanceCharge;
  const monthlyTax = monthlyPaymentPreTax * (salesTaxRate / 100);
  const monthlyPayment = monthlyPaymentPreTax + monthlyTax;

  const totalLeasePayments = monthlyPayment * leaseTermMonths;
  const totalDueAtSigning = downPayment + monthlyPayment; // first month + drive-offs

  const effectiveApr = moneyFactor * 2400;

  const totalMileageAllowance = annualMileage * (leaseTermMonths / 12);
  const totalCostToLease = downPayment + totalLeasePayments;

  return {
    adjustedCapCost: Math.round(adjustedCapCost * 100) / 100,
    residualValue: Math.round(residualValue * 100) / 100,
    monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
    monthlyFinanceCharge: Math.round(monthlyFinanceCharge * 100) / 100,
    monthlyPaymentPreTax: Math.round(monthlyPaymentPreTax * 100) / 100,
    monthlyTax: Math.round(monthlyTax * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalLeasePayments: Math.round(totalLeasePayments * 100) / 100,
    totalDueAtSigning: Math.round(totalDueAtSigning * 100) / 100,
    effectiveApr: Math.round(effectiveApr * 1000) / 1000,
    totalMileageAllowance,
    perMileOverageCharge: excessMileageRate,
    totalCostToLease: Math.round(totalCostToLease * 100) / 100,
    vsFinanceNote: `Leasing at ${Math.round(moneyFactor * 24000) / 10}% effective APR. At lease end you return the vehicle (residual ${residualPct}% of MSRP = $${Math.round(residualValue).toLocaleString()}).`,
  };
}
