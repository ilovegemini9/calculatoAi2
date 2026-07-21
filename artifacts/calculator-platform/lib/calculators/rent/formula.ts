export interface RentInput {
  monthlyRent: number;
  utilities: number;          // avg monthly utilities
  rentersInsurance: number;   // monthly
  parking: number;            // monthly
  petFee: number;             // monthly
  otherMonthly: number;       // other recurring monthly costs
  securityDeposit: number;    // one-time upfront
  brokerFee: number;          // one-time upfront (often 1 month's rent)
  annualRentIncrease: number; // % per year, e.g. 3
  leaseTermMonths: number;
}

export interface RentYearProjection {
  year: number;
  monthlyRent: number;
  annualTotal: number;
  cumulativeTotal: number;
}

export interface RentResult {
  monthlyTotal: number;
  annualTotal: number;
  totalLeaseCost: number;         // sum of all monthly costs over lease term
  totalUpfront: number;           // deposit + broker fee
  totalTrueFirstYear: number;     // first year monthly costs + upfront
  costPerDay: number;
  rentBreakdown: {
    label: string;
    monthly: number;
    annual: number;
    percent: number;
  }[];
  yearlyProjection: RentYearProjection[];
}

export function calculateRent(input: RentInput): RentResult {
  const {
    monthlyRent,
    utilities,
    rentersInsurance,
    parking,
    petFee,
    otherMonthly,
    securityDeposit,
    brokerFee,
    annualRentIncrease,
    leaseTermMonths,
  } = input;

  const monthlyTotal =
    monthlyRent + utilities + rentersInsurance + parking + petFee + otherMonthly;
  const annualTotal = monthlyTotal * 12;
  const totalUpfront = securityDeposit + brokerFee;
  const totalTrueFirstYear = annualTotal + totalUpfront;
  const costPerDay = Math.round((monthlyTotal / 30.44) * 100) / 100;

  // Total lease cost (rent may increase annually within the term)
  let totalLeaseCost = 0;
  let currentRent = monthlyRent;
  for (let month = 1; month <= leaseTermMonths; month++) {
    if (month > 1 && (month - 1) % 12 === 0) {
      currentRent = currentRent * (1 + annualRentIncrease / 100);
    }
    const nonRentMonthly = utilities + rentersInsurance + parking + petFee + otherMonthly;
    totalLeaseCost += currentRent + nonRentMonthly;
  }
  totalLeaseCost = Math.round(totalLeaseCost * 100) / 100;

  // Breakdown
  const items = [
    { label: 'Base Rent', monthly: monthlyRent },
    { label: 'Utilities', monthly: utilities },
    { label: "Renter's Insurance", monthly: rentersInsurance },
    { label: 'Parking', monthly: parking },
    { label: 'Pet Fee', monthly: petFee },
    { label: 'Other', monthly: otherMonthly },
  ].filter((i) => i.monthly > 0);

  const rentBreakdown = items.map((item) => ({
    label: item.label,
    monthly: item.monthly,
    annual: Math.round(item.monthly * 12 * 100) / 100,
    percent:
      monthlyTotal > 0
        ? Math.round((item.monthly / monthlyTotal) * 1000) / 10
        : 0,
  }));

  // Year-by-year projection (up to 10 years)
  const yearlyProjection: RentYearProjection[] = [];
  let projectedRent = monthlyRent;
  let cumulative = 0;
  const nonRent = utilities + rentersInsurance + parking + petFee + otherMonthly;
  for (let yr = 1; yr <= 10; yr++) {
    if (yr > 1) projectedRent = projectedRent * (1 + annualRentIncrease / 100);
    const annualForYear = Math.round((projectedRent + nonRent) * 12 * 100) / 100;
    cumulative = Math.round((cumulative + annualForYear) * 100) / 100;
    yearlyProjection.push({
      year: yr,
      monthlyRent: Math.round(projectedRent * 100) / 100,
      annualTotal: annualForYear,
      cumulativeTotal: cumulative,
    });
  }

  return {
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    annualTotal: Math.round(annualTotal * 100) / 100,
    totalLeaseCost,
    totalUpfront: Math.round(totalUpfront * 100) / 100,
    totalTrueFirstYear: Math.round(totalTrueFirstYear * 100) / 100,
    costPerDay,
    rentBreakdown,
    yearlyProjection,
  };
}
