/**
 * Per-calculator FAQ and HowTo content for SEO schemas.
 * Each calculator gets unique FAQs and step-by-step instructions.
 */

export interface CalcContent {
  howToSteps: string[];
  faqs: { question: string; answer: string }[];
}

export const CALCULATOR_CONTENT: Record<string, CalcContent> = {
  age: {
    howToSteps: [
      'Enter your date of birth in the "Date of Birth" field.',
      'Set the "Age at Date" to the date you want to calculate your age on (defaults to today).',
      'Your exact age in years, months, and days appears instantly in the results panel.',
      'Scroll down to see additional breakdowns: total weeks, days, hours, and minutes.',
    ],
    faqs: [
      { question: 'How accurate is the age calculator?', answer: 'Our age calculator is precise to the day, accounting for leap years and varying month lengths. It computes exact years, months, and remaining days.' },
      { question: 'Can I calculate age on a past or future date?', answer: 'Yes. Change the "Age at Date" field to any past or future date to calculate your age on that specific date.' },
      { question: 'How many days until my next birthday?', answer: 'The calculator shows "Next Birthday In" which displays the exact number of days remaining until your next birthday and the day of the week it falls on.' },
      { question: 'Does the calculator account for leap years?', answer: 'Yes. The formula uses exact calendar arithmetic that properly handles all leap years, including the century rule (years divisible by 100 but not 400 are not leap years).' },
    ],
  },
  bmi: {
    howToSteps: [
      'Select your unit system: Metric (kg/cm) or Imperial (lbs/inches).',
      'Enter your weight in the weight field.',
      'Enter your height in the height field.',
      'Your BMI score, weight category, and healthy weight range appear immediately.',
    ],
    faqs: [
      { question: 'What is a healthy BMI?', answer: 'A BMI between 18.5 and 24.9 is considered healthy for most adults. Below 18.5 is underweight, 25–29.9 is overweight, and 30 or above is obese.' },
      { question: 'How is BMI calculated?', answer: 'BMI = weight (kg) ÷ height² (m). For imperial units: BMI = 703 × weight (lbs) ÷ height² (inches). Our calculator handles both unit systems automatically.' },
      { question: 'Is BMI accurate for everyone?', answer: 'BMI is a useful screening tool but has limitations. It may overestimate body fat in athletes with high muscle mass and underestimate it in older adults. Consult a healthcare professional for a complete assessment.' },
      { question: 'What is my ideal weight according to BMI?', answer: 'The calculator shows your healthy weight range based on your height. This is the weight range where BMI falls between 18.5 and 24.9.' },
    ],
  },
  calorie: {
    howToSteps: [
      'Select your unit system (metric or imperial) and gender.',
      'Enter your age, weight, and height.',
      'Choose your activity level from the dropdown — be honest for accurate results.',
      'The calculator displays your BMR, TDEE, and a complete goal table for weight loss and gain.',
    ],
    faqs: [
      { question: 'What is BMR?', answer: 'BMR (Basal Metabolic Rate) is the number of calories your body burns at complete rest — just to maintain basic functions like breathing and circulation. It is calculated using the Mifflin-St Jeor formula.' },
      { question: 'What is TDEE?', answer: 'TDEE (Total Daily Energy Expenditure) is your BMR multiplied by an activity factor. It represents the total calories you burn per day including exercise and daily movement.' },
      { question: 'How many calories should I eat to lose weight?', answer: 'A deficit of 500 calories/day below your maintenance level leads to approximately 0.5 kg (1 lb) of weight loss per week. Our calculator shows exact targets for mild, moderate, and aggressive weight loss.' },
      { question: 'What activity level should I choose?', answer: 'Sedentary = desk job, no exercise. Light = 1–3 days/week exercise. Moderate = 3–5 days/week. Active = 6–7 days/week. Very Active = hard exercise twice per day or a physical job.' },
    ],
  },
  gpa: {
    howToSteps: [
      'Add each course by clicking the "+ Add Course" button.',
      'Enter the course name (optional), select your letter grade, and enter the credit hours.',
      'Select the course type: Regular, Honors (+0.5 bonus), or AP/IB (+1.0 bonus).',
      'Your weighted and unweighted GPA updates automatically as you add courses.',
    ],
    faqs: [
      { question: 'What is the difference between weighted and unweighted GPA?', answer: 'Unweighted GPA uses a standard 4.0 scale for all courses. Weighted GPA gives bonus points for harder courses: +0.5 for Honors and +1.0 for AP/IB courses, meaning it can exceed 4.0.' },
      { question: 'What GPA do I need for college?', answer: 'Most selective universities look for a weighted GPA of 3.5 or higher. Highly selective schools often see applicants with 4.0+ weighted GPAs. However, GPA is just one factor in admissions.' },
      { question: 'How are credit hours used in GPA calculation?', answer: 'Credit hours weight each course. A 4-credit course counts more than a 1-credit course. GPA = (sum of grade points × credits) ÷ (total credits).' },
      { question: 'What letter grade is needed for a 3.0 GPA?', answer: 'A B (3.0 grade points) in every course would give a 3.0 GPA. Mixing A and C grades can also average to 3.0, depending on course weights.' },
    ],
  },
  loan: {
    howToSteps: [
      'Enter the total loan amount in dollars.',
      'Enter the annual interest rate (e.g., 5.5 for 5.5%).',
      'Set the loan term and select whether it is in years or months.',
      'See your monthly payment, total interest, total cost, and a full amortization schedule.',
    ],
    faqs: [
      { question: 'How is the monthly loan payment calculated?', answer: 'Monthly payment = P × [r(1+r)^n] / [(1+r)^n - 1], where P is the principal, r is the monthly interest rate, and n is the number of payments. For 0% interest, it is simply P ÷ n.' },
      { question: 'What is an amortization schedule?', answer: 'An amortization schedule shows how each payment is split between principal and interest over the life of the loan. Early payments go mostly to interest; later payments go mostly to principal.' },
      { question: 'How can I reduce total interest paid?', answer: 'Making extra principal payments early in the loan, choosing a shorter term, or refinancing at a lower rate are the most effective ways to reduce total interest.' },
      { question: 'Does this calculator work for auto loans and personal loans?', answer: 'Yes. This calculator works for any fixed-rate, fixed-term loan including auto loans, personal loans, student loans, and business loans.' },
    ],
  },
  mortgage: {
    howToSteps: [
      'Enter the home price and down payment amount.',
      'Enter the annual interest rate and loan term (commonly 15 or 30 years).',
      'Optionally add property tax rate (annual % of home value), home insurance (annual $), and HOA fee (monthly $).',
      'See your complete PITI breakdown and total cost over the life of the loan.',
    ],
    faqs: [
      { question: 'What does PITI stand for?', answer: 'PITI stands for Principal, Interest, Taxes, and Insurance — the four components of a complete monthly mortgage payment. Lenders use your PITI to determine if you can afford a mortgage.' },
      { question: 'How much down payment do I need?', answer: 'Conventional loans typically require 20% down to avoid PMI (private mortgage insurance). FHA loans allow as little as 3.5% down. The calculator shows your payment at any down payment amount.' },
      { question: 'How is the monthly mortgage payment calculated?', answer: 'The principal and interest portion uses the standard amortization formula. Property tax is your home value × tax rate ÷ 12. Insurance is your annual premium ÷ 12.' },
      { question: 'What is the 28% rule for mortgages?', answer: 'The 28% rule says your monthly mortgage payment should not exceed 28% of your gross monthly income. Lenders also look at total debt (36% rule). Use the calculator to find a payment that fits within these guidelines.' },
    ],
  },
  percentage: {
    howToSteps: [
      'Select the type of percentage calculation from the dropdown.',
      '"What is X% of Y?" — enter the percentage and the base number.',
      '"X is what % of Y?" — enter both numbers to find the percentage relationship.',
      '"% change from X to Y?" — enter the original and new value to find increase or decrease.',
    ],
    faqs: [
      { question: 'How do I calculate what percent one number is of another?', answer: 'Divide the part by the whole and multiply by 100. Example: 30 is what percent of 150? = (30 ÷ 150) × 100 = 20%. Use the "X is what % of Y?" mode.' },
      { question: 'How do I calculate percentage increase?', answer: 'Percentage increase = [(New Value − Old Value) ÷ Old Value] × 100. Example: from 80 to 100 = [(100−80) ÷ 80] × 100 = 25% increase. Use the "% change" mode.' },
      { question: 'How do I find X% of a number?', answer: 'Multiply the number by the percentage divided by 100. Example: 15% of 200 = 200 × (15 ÷ 100) = 30. Use "What is X% of Y?" mode.' },
      { question: 'What is the difference between percentage and percentage points?', answer: 'A percentage point is an absolute difference between two percentages. If interest rates rise from 2% to 4%, that is a 2 percentage point increase, but a 100% percentage increase.' },
    ],
  },
  tip: {
    howToSteps: [
      'Enter the total bill amount before tax.',
      'Enter the tip percentage or click one of the quick-select buttons (10%, 15%, 18%, 20%, etc.).',
      'Enter the number of people splitting the bill.',
      'See the tip amount, total bill, and per-person amounts instantly.',
    ],
    faqs: [
      { question: 'How much should I tip at a restaurant?', answer: 'Standard restaurant tipping in the US is 15–20% for adequate service, 20–25% for excellent service, and 10% or less for poor service. Some groups tip on the pre-tax amount, others on the full bill.' },
      { question: 'Should I tip on the pre-tax or post-tax amount?', answer: 'Tipping etiquette varies. Most guides suggest tipping on the pre-tax amount since the server did not provide the government\'s service. However, many people find it easier to tip on the total.' },
      { question: 'How do I split a bill unevenly?', answer: 'This calculator splits the bill evenly among the number of people entered. For uneven splits, calculate the total bill with tip first, then divide manually based on what each person ordered.' },
      { question: 'Is tipping mandatory?', answer: 'In the US, tipping is customary but not legally required for most services. However, service workers in many industries depend on tips as a significant portion of their income.' },
    ],
  },
};
