import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateMortgage } from '../lib/calculators/mortgage/formula';

function closeTo(actual: number, expected: number, digits = 1) {
  const margin = 0.5 * Math.pow(10, -digits);
  assert.ok(
    Math.abs(actual - expected) <= margin,
    `Expected ${actual} to be close to ${expected} (±${margin})`
  );
}

const base = { homePrice: 300000, downPayment: 60000, interestRate: 6, loanTermYears: 30 };

describe('calculateMortgage — P&I payment', () => {
  it('$240k at 6% over 30 years → monthly P&I between $1438–$1440', () => {
    const r = calculateMortgage(base);
    assert.ok(r.monthlyPrincipalAndInterest > 1438);
    assert.ok(r.monthlyPrincipalAndInterest < 1440);
  });

  it('0% interest → payment = principal / 360 ≈ 666.67', () => {
    const r = calculateMortgage({ ...base, interestRate: 0 });
    closeTo(r.monthlyPrincipalAndInterest, 666.67, 1);
    assert.strictEqual(r.totalInterest, 0);
  });

  it('down payment > home price → principal = 0, no interest', () => {
    const r = calculateMortgage({ ...base, downPayment: 400000 });
    assert.strictEqual(r.totalPrincipal, 0);
    assert.strictEqual(r.totalInterest, 0);
  });
});

describe('calculateMortgage — ancillary costs', () => {
  it('1.2% annual tax on $300k = $300/month', () => {
    const r = calculateMortgage({ ...base, propertyTaxRate: 1.2 });
    closeTo(r.monthlyPropertyTax, 300, 1);
  });

  it('$1800/yr insurance = $150/month', () => {
    const r = calculateMortgage({ ...base, homeInsuranceAnnual: 1800 });
    closeTo(r.monthlyInsurance, 150, 1);
  });

  it('$250 HOA passed through directly', () => {
    const r = calculateMortgage({ ...base, hoaMonthly: 250 });
    assert.strictEqual(r.monthlyHoa, 250);
  });

  it('totalMonthlyPayment = P&I + tax + insurance + HOA', () => {
    const r = calculateMortgage({ ...base, propertyTaxRate: 1.2, homeInsuranceAnnual: 1800, hoaMonthly: 250 });
    const expected = r.monthlyPrincipalAndInterest + r.monthlyPropertyTax + r.monthlyInsurance + r.monthlyHoa;
    closeTo(r.totalMonthlyPayment, expected, 1);
  });

  it('optional fields default to 0 when omitted', () => {
    const r = calculateMortgage(base);
    assert.strictEqual(r.monthlyPropertyTax, 0);
    assert.strictEqual(r.monthlyInsurance, 0);
    assert.strictEqual(r.monthlyHoa, 0);
  });
});

describe('calculateMortgage — amortization schedule', () => {
  const r = calculateMortgage(base);

  it('generates 360 rows', () => assert.strictEqual(r.amortizationSchedule.length, 360));
  it('final balance = 0', () => assert.strictEqual(r.amortizationSchedule[359].remainingBalance, 0));
  it('balance decreases each payment', () => {
    for (let i = 1; i < r.amortizationSchedule.length; i++) {
      assert.ok(r.amortizationSchedule[i].remainingBalance <= r.amortizationSchedule[i - 1].remainingBalance);
    }
  });
  it('early interest > late interest', () => {
    assert.ok(r.amortizationSchedule[0].interest > r.amortizationSchedule[359].interest);
  });
  it('early principal < late principal', () => {
    assert.ok(r.amortizationSchedule[0].principal < r.amortizationSchedule[359].principal);
  });
});

describe('calculateMortgage — invariants', () => {
  it('totalCost ≈ totalPrincipal + totalInterest', () => {
    const r = calculateMortgage(base);
    closeTo(r.totalCost, r.totalPrincipal + r.totalInterest, 0);
  });

  it('shorter term → less total interest', () => {
    const long  = calculateMortgage({ ...base, loanTermYears: 30 });
    const short = calculateMortgage({ ...base, loanTermYears: 15 });
    assert.ok(short.totalInterest < long.totalInterest);
  });

  it('shorter term → higher monthly payment', () => {
    const long  = calculateMortgage({ ...base, loanTermYears: 30 });
    const short = calculateMortgage({ ...base, loanTermYears: 15 });
    assert.ok(short.monthlyPrincipalAndInterest > long.monthlyPrincipalAndInterest);
  });
});
