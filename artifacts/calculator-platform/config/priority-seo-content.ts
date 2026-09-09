import { CALCULATOR_CONTENT } from './calculator-content';

/**
 * High-intent SEO enrichment for the first competitive calculator wave.
 * This is applied as a side-effect so existing content stays backward compatible.
 * The content is intentionally factual: formulas, examples, assumptions, and pitfalls.
 */

const ENRICHMENTS: Record<string, Partial<(typeof CALCULATOR_CONTENT)[string]>> = {
  mortgage: {
    howToSteps: [
      'Enter the mortgage principal, annual interest rate, and loan term.',
      'Review the estimated monthly principal-and-interest payment and the total paid over the full term.',
      'Compare total interest with a shorter term or different rate before making a borrowing decision.',
      'Use the amortization view to see how the payment shifts from interest toward principal over time.',
    ],
    formula: {
      expression: 'M = P × [r(1+r)^n] ÷ [(1+r)^n − 1]',
      variables: [
        { symbol: 'M', definition: 'Monthly principal-and-interest payment' },
        { symbol: 'P', definition: 'Loan principal' },
        { symbol: 'r', definition: 'Monthly interest rate = annual rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Number of monthly payments = years × 12' },
      ],
      notes: 'This formula covers the fixed-rate amortizing loan calculation. Taxes, insurance, HOA dues, PMI, fees, and adjustable-rate changes are separate assumptions unless the calculator explicitly includes them.',
    },
    examples: [{
      title: '30-year fixed mortgage',
      scenario: '$200,000 principal at 6% annual interest for 30 years.',
      steps: ['Convert 6% annual interest to 0.5% monthly.', 'Use 360 monthly payments.', 'Apply the fixed-payment amortization formula.', 'Compare the payment with the total interest over 360 payments.'],
      result: 'The monthly principal-and-interest payment is about $1,199.10; taxes, insurance and other housing costs are not included in that figure.',
    }],
    useCases: ['Compare loan terms and interest-rate scenarios.', 'Estimate principal-and-interest payments before shopping for a home.', 'Understand how term length changes total interest.'],
    commonPitfalls: ['Confusing principal-and-interest with the full housing payment.', 'Using an annual rate directly as the monthly rate.', 'Ignoring closing costs, taxes, insurance, PMI, or rate changes when comparing real offers.'],
    faqs: [
      { question: 'Does the mortgage payment include taxes and insurance?', answer: 'The core amortization formula calculates principal and interest. Taxes, insurance, PMI, and other costs must be modeled separately when applicable.' },
      { question: 'Why does a longer mortgage usually cost more interest?', answer: 'A longer term spreads repayment across more periods, so interest is charged over a longer time even when the monthly payment is lower.' },
      { question: 'Can I compare two mortgage rates with this calculator?', answer: 'Yes. Keep the principal and term constant, change the rate, and compare the resulting payment and total interest.' },
      { question: 'Is the result a loan offer?', answer: 'No. It is a mathematical estimate based on the inputs. Actual lender terms depend on the loan product and borrower.' },
    ],
  },
  percentage: {
    howToSteps: ['Enter the part and whole values.', 'Review the percentage represented by the part.', 'Use the reverse relationships when you need to solve for the part or whole.', 'Keep the denominator non-zero and label whether you mean percent of a value or percentage change.'],
    formula: {
      expression: 'Percentage = part ÷ whole × 100',
      variables: [
        { symbol: 'part', definition: 'The quantity being compared' },
        { symbol: 'whole', definition: 'The reference quantity or total' },
        { symbol: 'percentage', definition: 'Part expressed as a percentage of the whole' },
      ],
      notes: 'Percentage change uses a different denominator: (new − original) ÷ original × 100. Do not substitute one formula for the other.',
    },
    examples: [{ title: 'What percent is 25 of 200?', scenario: 'Part = 25 and whole = 200.', steps: ['Divide 25 by 200.', 'Multiply by 100.', 'Interpret the result as a share of the whole.'], result: '25 is 12.5% of 200.' }],
    useCases: ['Grades and scores.', 'Discounts and price comparisons.', 'Business ratios and simple reporting.', 'Percentage-based budgeting and allocation.'],
    commonPitfalls: ['Using the wrong reference value as the denominator.', 'Confusing percentage points with percent change.', 'Entering a zero whole value.'],
    faqs: [
      { question: 'How do I calculate x% of a number?', answer: 'Multiply the number by x ÷ 100.' },
      { question: 'Is percentage increase the same as percentage?', answer: 'No. Percentage increase compares the change with the original value; a basic percentage compares a part with a whole.' },
      { question: 'Can percentages exceed 100%?', answer: 'Yes. A part can be larger than the chosen reference whole, producing a percentage above 100%.' },
    ],
  },
  fraction: {
    howToSteps: ['Enter the numerators and denominators for the two fractions.', 'Check that neither denominator is zero.', 'Review the calculated result and its reduced form.', 'For addition or subtraction, use a common denominator before combining numerators.'],
    formula: {
      expression: 'a/b + c/d = (ad + bc) / bd',
      variables: [
        { symbol: 'a,c', definition: 'Numerators of the two fractions' },
        { symbol: 'b,d', definition: 'Non-zero denominators' },
        { symbol: 'ad + bc', definition: 'Numerator after converting to a common denominator' },
        { symbol: 'bd', definition: 'Common denominator before reduction' },
      ],
      notes: 'The result is reduced by dividing numerator and denominator by their greatest common divisor where applicable.',
    },
    examples: [{ title: 'Add 1/3 and 1/6', scenario: 'Two positive fractions with different denominators.', steps: ['Use 6 as a common denominator.', 'Convert 1/3 to 2/6.', 'Add 2/6 + 1/6.', 'Reduce if necessary.'], result: '1/3 + 1/6 = 1/2.' }],
    useCases: ['School math and homework checks.', 'Recipe and measurement calculations.', 'Ratio and proportional reasoning.'],
    commonPitfalls: ['Adding denominators directly.', 'Forgetting to reduce the final fraction.', 'Entering zero as a denominator.'],
    faqs: [
      { question: 'Why can’t I add the denominators?', answer: 'Fractions must represent equivalent parts of the same whole before their numerators can be combined.' },
      { question: 'How is a fraction reduced?', answer: 'Divide the numerator and denominator by their greatest common divisor.' },
      { question: 'Can fractions be negative?', answer: 'Yes. A negative sign can be represented in the numerator or denominator, with the same overall value.' },
    ],
  },
  grade: {
    howToSteps: ['Enter points earned.', 'Enter points possible.', 'Review the percentage and simple letter-grade band.', 'If your school uses a different grading scale, compare the percentage with that institution’s policy.'],
    formula: {
      expression: 'Grade percentage = points earned ÷ points possible × 100',
      variables: [
        { symbol: 'earned', definition: 'Points received on the assignment or assessment' },
        { symbol: 'possible', definition: 'Maximum available points' },
        { symbol: 'percentage', definition: 'Score normalized to a 0–100 percentage scale' },
      ],
      notes: 'Letter bands vary by school. A simple A/B/C/D/F mapping is only a reference unless the course or institution publishes the same cutoffs.',
    },
    examples: [{ title: 'Quiz score', scenario: 'Earn 42 points out of 50.', steps: ['Divide 42 by 50.', 'Multiply by 100.', 'Compare 84% with the displayed letter-band reference.', 'Use the course syllabus for the official grade.'], result: '42/50 = 84%.' }],
    useCases: ['Check an assessment percentage.', 'Estimate the effect of a score on a points-based course.', 'Translate raw points into a percentage.'],
    commonPitfalls: ['Assuming every school uses the same letter cutoffs.', 'Mixing weighted and unweighted assignments.', 'Using total points when the course is weighted by category.'],
    faqs: [
      { question: 'What grade is 90%?', answer: 'The calculator can show a simple letter-band reference, but your school or teacher’s published grading scale is authoritative.' },
      { question: 'Does this calculate weighted course grades?', answer: 'The basic points-based route converts earned points out of possible points. Weighted courses need category weights and additional inputs.' },
      { question: 'Can I use it for a single assignment?', answer: 'Yes. Enter the points earned and the points possible for that assessment.' },
    ],
  },
  time: {
    howToSteps: ['Enter the start time and end time.', 'Choose the appropriate same-day or overnight interpretation.', 'Review the duration in hours and minutes.', 'Use the result as elapsed time, not as a clock-time conversion.'],
    formula: {
      expression: 'Elapsed minutes = end time − start time; if the interval crosses midnight, add 1,440 minutes.',
      variables: [
        { symbol: 'start', definition: 'Starting clock time converted to minutes after midnight' },
        { symbol: 'end', definition: 'Ending clock time converted to minutes after midnight' },
        { symbol: '1,440', definition: 'Number of minutes in a 24-hour day' },
      ],
      notes: 'The calculator distinguishes a duration from a time-of-day. Crossing midnight requires an explicit overnight interpretation.',
    },
    examples: [{ title: 'Work shift crossing midnight', scenario: 'Start at 22:30 and finish at 06:30 the next day.', steps: ['Convert 22:30 to 1,350 minutes.', 'Convert 06:30 to 390 minutes.', 'Add 1,440 minutes to the end time for an overnight interval.', 'Subtract the start time.'], result: 'Elapsed time is 8 hours.' }],
    useCases: ['Work-shift duration.', 'Travel and event timing.', 'Study or exercise sessions.', 'Elapsed-time checks across midnight.'],
    commonPitfalls: ['Subtracting clock labels without handling midnight.', 'Confusing 1:30 with 13:30.', 'Treating decimal hours and hours:minutes as interchangeable.'],
    faqs: [
      { question: 'How do I calculate hours between two times overnight?', answer: 'Treat the end time as occurring on the following day, then subtract the start from the adjusted end.' },
      { question: 'Is 90 minutes equal to 1.90 hours?', answer: 'No. 90 minutes is 1.5 hours. Decimal hours and clock minutes use different representations.' },
      { question: 'Does the calculator handle dates?', answer: 'The time-duration calculation is intended for clock-time intervals; use a date calculator when the interval spans multiple calendar dates.' },
    ],
  },
};

for (const [slug, enrichment] of Object.entries(ENRICHMENTS)) {
  const base = CALCULATOR_CONTENT[slug];
  if (!base) continue;
  CALCULATOR_CONTENT[slug] = { ...base, ...enrichment };
}
