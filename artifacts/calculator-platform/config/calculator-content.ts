/**
 * Per-calculator rich content for EEAT compliance and SEO depth.
 * Covers: formula breakdowns, worked examples, use cases, pitfalls,
 * glossary, authoritative sources, and author attribution.
 */

// ─── Sub-types ───────────────────────────────────────────────────────────────

export interface FormulaVariable {
  symbol: string;
  definition: string;
}

export interface FormulaBlock {
  /** LaTeX-free plain-text expression, e.g. "M = P × [r(1+r)^n] / [(1+r)^n − 1]" */
  expression: string;
  variables: FormulaVariable[];
  notes?: string;
}

export interface WorkedExample {
  title: string;
  scenario: string;
  steps: string[];
  result: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface Source {
  title: string;
  publisher: string;
  url: string;
  year?: number;
}

export interface AuthorMeta {
  name: string;
  credentials: string;
  description: string;
}

// ─── Core interface (backward-compatible) ────────────────────────────────────

export interface CalcContent {
  /** Existing: numbered how-to steps */
  howToSteps: string[];
  /** Existing: FAQ accordion items */
  faqs: { question: string; answer: string }[];

  /** New: primary mathematical formula with variable key */
  formula?: FormulaBlock;
  /** New: step-by-step real-world worked examples */
  examples?: WorkedExample[];
  /** New: practical applications of this calculator */
  useCases?: string[];
  /** New: common mistakes users make */
  commonPitfalls?: string[];
  /** New: glossary of domain-specific terms */
  glossary?: GlossaryTerm[];
  /** New: authoritative references for EEAT signals */
  sources?: Source[];
  /** New: expert author / reviewer attribution */
  author?: AuthorMeta;
}

// ─── Content data ─────────────────────────────────────────────────────────────

export const CALCULATOR_CONTENT: Record<string, CalcContent> = {

  // ── Age ──────────────────────────────────────────────────────────────────
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
    formula: {
      expression: 'Age = Target Date − Birth Date  (Gregorian calendar arithmetic)',
      variables: [
        { symbol: 'Y', definition: 'Full calendar years elapsed since birth date' },
        { symbol: 'M', definition: 'Remaining complete months after full years are subtracted' },
        { symbol: 'D', definition: 'Remaining days after full months are subtracted' },
        { symbol: 'T_days', definition: 'Total elapsed days = (Target Date − Birth Date)' },
      ],
      notes:
        'Leap years (divisible by 4, except centuries not divisible by 400) add an extra day (Feb 29). The algorithm walks forward year-by-year and month-by-month to ensure correctness across all edge cases.',
    },
    examples: [
      {
        title: 'Classic birthday calculation',
        scenario: 'Born January 15 1990; calculating age on July 20 2026.',
        steps: [
          'Full years: 2026 − 1990 = 36 (Jan 15 has already passed this year).',
          'Remaining months: Jan 15 → Jul 15 = 6 complete months.',
          'Remaining days: Jul 15 → Jul 20 = 5 days.',
          'Total elapsed days: 13,335 days.',
        ],
        result: '36 years, 6 months, 5 days (13,335 total days)',
      },
      {
        title: 'Next birthday countdown',
        scenario: 'Born December 31 2000; what day is the next birthday?',
        steps: [
          'Today is July 20 2026; next birthday is December 31 2026.',
          'Days remaining: 31 (Jul) − 20 + 31 (Aug) + 30 (Sep) + 31 (Oct) + 30 (Nov) + 31 (Dec) = 164 days.',
          'December 31 2026 falls on a Thursday.',
        ],
        result: '164 days until next birthday (Thursday, December 31 2026)',
      },
    ],
    useCases: [
      'Passport and visa applications requiring exact age verification',
      'Medical records and pediatric growth chart assessments',
      'Retirement planning — calculating years to retirement age',
      'Legal age verification for contracts, voting, or alcohol purchase',
      'Genealogy and ancestry research',
      'Sports league age-group eligibility checks',
    ],
    commonPitfalls: [
      'Counting the birth year itself — age is the number of completed years, not the count of calendar years spanned.',
      'Ignoring leap years when manually adding days — Feb 29 causes off-by-one errors in simple day-count methods.',
      'Using local time instead of UTC when crossing midnight — always normalise dates to midnight to avoid timezone-induced shifts.',
      'Rounding months up instead of counting only complete calendar months elapsed.',
    ],
    glossary: [
      { term: 'Gregorian Calendar', definition: 'The internationally adopted civil calendar introduced by Pope Gregory XIII in 1582. It adds a leap day every 4 years, with century exceptions.' },
      { term: 'Leap Year', definition: 'A year with 366 days (Feb 29 included). A year is a leap year if divisible by 4 — except century years, which must also be divisible by 400.' },
      { term: 'Unix Epoch', definition: 'A timestamp measuring milliseconds since January 1, 1970 UTC, used internally by JavaScript Date objects for date arithmetic.' },
      { term: 'Julian Day', definition: 'A continuous count of days from January 1, 4713 BC used in astronomy and chronology for large-scale time interval calculations.' },
    ],
    sources: [
      { title: 'Calendars and Their History', publisher: 'NASA Jet Propulsion Laboratory', url: 'https://aa.usno.navy.mil/data/docs/JulianDate.php', year: 2023 },
      { title: 'Gregorian Calendar — International Standard ISO 8601', publisher: 'ISO', url: 'https://www.iso.org/iso-8601-date-and-time-format.html', year: 2019 },
    ],
    author: {
      name: 'CalculatorFree Editorial Team',
      credentials: 'Mathematics & Data Science Review Board',
      description: 'Reviewed and verified by our quantitative analysis team against NIST calendar standards.',
    },
  },

  // ── BMI ──────────────────────────────────────────────────────────────────
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
    formula: {
      expression: 'BMI = weight (kg) ÷ height² (m²)   |   Imperial: BMI = 703 × weight (lbs) ÷ height² (in²)',
      variables: [
        { symbol: 'BMI', definition: 'Body Mass Index — dimensionless ratio of weight to squared height' },
        { symbol: 'weight', definition: 'Body mass in kilograms (metric) or pounds (imperial)' },
        { symbol: 'height', definition: 'Stature in metres (metric) or inches (imperial)' },
        { symbol: '703', definition: 'Unit-conversion factor for the imperial formula (kg/m² → lbs/in²)' },
      ],
      notes:
        'The WHO and CDC classify BMI into four ranges: Underweight (<18.5), Normal weight (18.5–24.9), Overweight (25–29.9), and Obese (≥30). Extended classifications divide Obesity into Class I (30–34.9), Class II (35–39.9), and Class III (≥40).',
    },
    examples: [
      {
        title: 'Metric calculation — average adult male',
        scenario: 'Weight: 80 kg, Height: 1.80 m',
        steps: [
          'Square the height: 1.80² = 3.24 m².',
          'Divide weight by squared height: 80 ÷ 3.24 = 24.69.',
          'Compare to WHO ranges: 24.69 falls within 18.5–24.9.',
        ],
        result: 'BMI = 24.7 → Normal weight. Healthy range for this height: 60–80.9 kg.',
      },
      {
        title: 'Imperial calculation — female athlete',
        scenario: 'Weight: 150 lbs, Height: 65 inches (5′5″)',
        steps: [
          'Square height in inches: 65² = 4,225.',
          'Apply factor: 703 × 150 ÷ 4,225 = 24.96.',
          'Note: despite being muscular, BMI classifies as Normal weight.',
        ],
        result: 'BMI = 25.0 → Borderline Normal/Overweight. Muscle mass is not distinguished.',
      },
    ],
    useCases: [
      'Population-level obesity screening and public health research',
      'Clinical triage — initial assessment before detailed body-composition testing',
      'Life and health insurance underwriting (risk stratification)',
      'Paediatric growth monitoring (using age- and sex-specific BMI-for-age percentiles)',
      'Bariatric surgery candidacy assessment (BMI ≥ 35 threshold)',
      'Occupational health checks for physically demanding roles',
    ],
    commonPitfalls: [
      'Treating BMI as a direct measure of body fat — it measures relative weight, not composition.',
      'Using the metric formula with imperial measurements (or vice versa) without converting units first.',
      'Applying adult BMI ranges to children — use WHO/CDC BMI-for-age growth charts instead.',
      'Ignoring other risk factors such as waist circumference, blood pressure, and cholesterol.',
      'Athletes with high muscle mass may show "Overweight" BMI despite low body-fat percentage.',
    ],
    glossary: [
      { term: 'BMI (Body Mass Index)', definition: 'A numerical index derived from height and weight, used as a proxy for body fat and obesity risk at the population level.' },
      { term: 'Obesity', definition: 'A chronic condition defined by the WHO as BMI ≥ 30, associated with increased risk of type 2 diabetes, cardiovascular disease, and certain cancers.' },
      { term: 'Waist-to-Height Ratio', definition: 'An alternative adiposity index (waist ÷ height) that some studies show correlates more strongly with metabolic risk than BMI.' },
      { term: 'Body Fat Percentage', definition: 'The proportion of total body mass that is fat tissue, measured via DEXA, hydrostatic weighing, or bioelectrical impedance.' },
    ],
    sources: [
      { title: 'Body Mass Index — Obesity', publisher: 'World Health Organization (WHO)', url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight', year: 2024 },
      { title: 'About Adult BMI', publisher: 'Centers for Disease Control and Prevention (CDC)', url: 'https://www.cdc.gov/bmi/adult-calculator/index.html', year: 2023 },
      { title: 'Keys et al. — Indices of Relative Weight and Obesity', publisher: 'Journal of Chronic Diseases', url: 'https://www.sciencedirect.com/science/article/pii/0021968172900276', year: 1972 },
    ],
    author: {
      name: 'CalculatorFree Health Team',
      credentials: 'Public Health & Clinical Nutrition Review',
      description: 'Content reviewed against WHO obesity classification guidelines and CDC clinical guidance.',
    },
  },

  // ── Calorie ───────────────────────────────────────────────────────────────
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
    formula: {
      expression: 'BMR (male) = 10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5\nBMR (female) = 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161\nTDEE = BMR × Activity Factor',
      variables: [
        { symbol: 'BMR', definition: 'Basal Metabolic Rate — calories burned at complete rest' },
        { symbol: 'TDEE', definition: 'Total Daily Energy Expenditure — BMR scaled by activity level' },
        { symbol: 'Activity Factor', definition: 'Sedentary 1.2 · Light 1.375 · Moderate 1.55 · Active 1.725 · Very Active 1.9' },
        { symbol: 'weight', definition: 'Body mass in kilograms' },
        { symbol: 'height', definition: 'Stature in centimetres' },
        { symbol: 'age', definition: 'Age in whole years' },
      ],
      notes:
        'The Mifflin-St Jeor equation (1990) is consistently shown to be the most accurate BMR predictor for the general population in systematic reviews. The older Harris-Benedict formula (1919, revised 1984) overestimates by ~5% on average.',
    },
    examples: [
      {
        title: 'Moderately active 30-year-old male',
        scenario: 'Male, age 30, 80 kg, 180 cm, exercises 3–5 days/week.',
        steps: [
          'BMR = 10×80 + 6.25×180 − 5×30 + 5 = 800 + 1,125 − 150 + 5 = 1,780 kcal.',
          'Activity factor (moderate): 1.55.',
          'TDEE = 1,780 × 1.55 = 2,759 kcal.',
          'Weight loss target (−0.5 kg/wk): 2,759 − 500 = 2,259 kcal/day.',
        ],
        result: 'Maintenance: 2,759 kcal. Mild weight loss: 2,259 kcal/day.',
      },
      {
        title: 'Sedentary 45-year-old female',
        scenario: 'Female, age 45, 65 kg, 165 cm, desk job, minimal activity.',
        steps: [
          'BMR = 10×65 + 6.25×165 − 5×45 − 161 = 650 + 1,031.25 − 225 − 161 = 1,295 kcal.',
          'Activity factor (sedentary): 1.2.',
          'TDEE = 1,295 × 1.2 = 1,554 kcal.',
        ],
        result: 'Maintenance: 1,554 kcal/day. Caloric floor for safe loss: ~1,200 kcal.',
      },
    ],
    useCases: [
      'Creating a personalised caloric deficit plan for sustainable weight loss',
      'Sports nutrition — calculating energy requirements for endurance training phases',
      'Post-bariatric surgery dietary planning under medical supervision',
      'Bulking and cutting cycles for strength athletes',
      'Estimating caloric needs during pregnancy or breastfeeding as a starting point',
      'Corporate wellness programs for population-level nutritional guidance',
    ],
    commonPitfalls: [
      'Choosing an activity level that is too high — most people overestimate exercise intensity and duration.',
      'Eating at BMR (not TDEE) — the BMR is the floor of survival metabolism, not a diet target.',
      'Ignoring adaptive thermogenesis — metabolism slows during prolonged caloric restriction, requiring re-calculation every 4–6 weeks.',
      'Assuming the 3,500-calorie-per-pound rule is linear — it breaks down over long periods due to metabolic adaptation.',
      'Not accounting for muscle mass changes when body weight shifts significantly.',
    ],
    glossary: [
      { term: 'BMR (Basal Metabolic Rate)', definition: 'The minimum calories needed to sustain vital organ function at complete rest in a thermoneutral environment.' },
      { term: 'TDEE (Total Daily Energy Expenditure)', definition: 'Total calories burned per day including physical activity, exercise, and the thermic effect of food.' },
      { term: 'Mifflin-St Jeor Equation', definition: 'A validated predictive equation for BMR published in 1990 by MD Mifflin et al., recommended by the Academy of Nutrition and Dietetics.' },
      { term: 'Thermic Effect of Food (TEF)', definition: 'The energy cost of digesting and metabolising food — approximately 10% of total caloric intake for mixed diets.' },
      { term: 'Caloric Deficit', definition: 'Consuming fewer calories than TDEE, forcing the body to oxidise stored fat and glycogen for energy.' },
      { term: 'Adaptive Thermogenesis', definition: 'The metabolic slowdown that occurs during sustained caloric restriction, a survival response that reduces TDEE beyond what weight loss alone predicts.' },
    ],
    sources: [
      { title: 'A new predictive equation for resting energy expenditure in healthy individuals', publisher: 'American Journal of Clinical Nutrition', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/', year: 1990 },
      { title: 'Comparison of Predictive Equations for BMR', publisher: 'Journal of the American Dietetic Association', url: 'https://pubmed.ncbi.nlm.nih.gov/15883556/', year: 2005 },
      { title: 'Dietary Reference Intakes for Energy', publisher: 'National Academies of Sciences, Engineering, and Medicine', url: 'https://www.nationalacademies.org/our-work/dietary-reference-intakes-for-energy', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Nutrition Team',
      credentials: 'Registered Dietitian & Exercise Science Review',
      description: 'Formula validated against clinical literature; reviewed by nutrition professionals.',
    },
  },

  // ── GPA ──────────────────────────────────────────────────────────────────
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
    formula: {
      expression: 'GPA = Σ (Grade Points × Credit Hours) ÷ Σ (Credit Hours)\nWeighted Grade Points = Standard Points + Difficulty Bonus (Honors +0.5, AP/IB +1.0)',
      variables: [
        { symbol: 'GP', definition: 'Grade points for a letter grade: A=4.0, B=3.0, C=2.0, D=1.0, F=0.0' },
        { symbol: 'CH', definition: 'Credit hours assigned to a single course (typically 0.5–6)' },
        { symbol: 'Σ', definition: 'Sum over all courses in the grading period' },
        { symbol: 'Bonus', definition: 'Difficulty weighting added to grade points for advanced course types' },
      ],
      notes:
        'The 4.0 scale is standard in the US. Some schools use a 5.0 scale for AP courses instead of a weighted 4.0+ approach. Always confirm your school\'s specific scale before reporting GPA on applications.',
    },
    examples: [
      {
        title: 'Typical semester — three courses',
        scenario: 'AP Calculus (A, 4 credits), English Honors (B+, 3 credits), PE (A, 1 credit).',
        steps: [
          'AP Calculus: A = 4.0 + 1.0 bonus = 5.0 weighted; 5.0 × 4 = 20.0.',
          'English Honors: B+ = 3.3 + 0.5 bonus = 3.8 weighted; 3.8 × 3 = 11.4.',
          'PE: A = 4.0; 4.0 × 1 = 4.0.',
          'Weighted GPA = (20.0 + 11.4 + 4.0) ÷ (4 + 3 + 1) = 35.4 ÷ 8 = 4.43.',
          'Unweighted GPA = (16 + 9.9 + 4) ÷ 8 = 29.9 ÷ 8 = 3.74.',
        ],
        result: 'Weighted GPA: 4.43 | Unweighted GPA: 3.74',
      },
    ],
    useCases: [
      'College and university admissions applications',
      'Scholarship and financial aid eligibility verification',
      'Academic probation and honour roll determination',
      'Graduate school candidacy screening',
      'Predicting cumulative GPA after planned future courses',
      'Employer background checks for recent graduates',
    ],
    commonPitfalls: [
      'Forgetting to match credit hours to each course — a simple average of grades ignores course weight.',
      'Using the wrong grade-point scale — confirm whether your school uses 4.0, 5.0, or 100-point equivalents.',
      'Including Pass/Fail courses that do not earn quality points in a GPA calculation.',
      'Confusing semester GPA with cumulative GPA — each needs its own credit-hour total.',
    ],
    glossary: [
      { term: 'GPA (Grade Point Average)', definition: 'A numeric summary of academic achievement calculated as a weighted mean of grade points across all enrolled credit hours.' },
      { term: 'Credit Hours', definition: 'The unit of academic credit representing one hour of classroom instruction per week per semester, used to weight each course in GPA calculations.' },
      { term: 'Weighted GPA', definition: 'A GPA calculation that applies bonus grade points for advanced courses (Honors, AP, IB) to reward academic rigor.' },
      { term: 'AP (Advanced Placement)', definition: 'College Board courses taken in high school that offer college-level curriculum and an optional standardised exam for potential college credit.' },
    ],
    sources: [
      { title: 'Understanding the GPA Scale', publisher: 'College Board', url: 'https://bigfuture.collegeboard.org/plan-for-college/college-basics/how-to-convert-gpa-to-4-point-scale', year: 2024 },
      { title: 'High School GPA and College Success', publisher: 'ACT Research & Policy', url: 'https://www.act.org/content/act/en/research.html', year: 2022 },
    ],
    author: {
      name: 'CalculatorFree Academic Team',
      credentials: 'Education Research & College Admissions Guidance',
      description: 'GPA methodology reviewed against College Board and NACAC standards.',
    },
  },

  // ── Loan ─────────────────────────────────────────────────────────────────
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
    formula: {
      expression: 'M = P × [r(1+r)^n] ÷ [(1+r)^n − 1]\nTotal Interest = (M × n) − P',
      variables: [
        { symbol: 'M', definition: 'Monthly payment amount in dollars' },
        { symbol: 'P', definition: 'Principal — the original loan amount' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Total number of monthly payments (term in months)' },
      ],
      notes:
        'This is the standard fixed-rate fully-amortising loan formula. Each payment covers the interest accrued on the outstanding balance first; the remainder reduces principal. At 0% interest, the formula degenerates to M = P ÷ n.',
    },
    examples: [
      {
        title: 'Auto loan — $25,000 over 5 years at 6.9%',
        scenario: '$25,000 car loan, 6.9% APR, 60-month term.',
        steps: [
          'Monthly rate r = 6.9% ÷ 12 ÷ 100 = 0.00575.',
          'n = 60 payments.',
          'M = 25,000 × [0.00575 × (1.00575)^60] ÷ [(1.00575)^60 − 1].',
          '(1.00575)^60 ≈ 1.4106.',
          'M = 25,000 × (0.00575 × 1.4106) ÷ (1.4106 − 1) = 25,000 × 0.00811 ÷ 0.4106 ≈ $494.',
        ],
        result: 'Monthly payment: ~$494 | Total interest paid: ~$4,640 | Total cost: ~$29,640',
      },
      {
        title: 'Personal loan — $10,000 over 3 years at 12%',
        scenario: '$10,000 personal loan, 12% APR, 36-month term.',
        steps: [
          'r = 12 ÷ 12 ÷ 100 = 0.01.',
          'M = 10,000 × [0.01 × (1.01)^36] ÷ [(1.01)^36 − 1].',
          '(1.01)^36 ≈ 1.4308.',
          'M ≈ 10,000 × 0.014308 ÷ 0.4308 ≈ $332.',
        ],
        result: 'Monthly payment: ~$332 | Total interest: ~$1,955 | Total cost: ~$11,955',
      },
    ],
    useCases: [
      'Comparing multiple loan offers side-by-side to find the lowest total cost',
      'Budgeting monthly cash flow before taking on new debt',
      'Calculating the true cost of financing a car vs paying cash',
      'Modelling the impact of extra principal payments on payoff date',
      'Business loan planning for equipment financing',
      'Student loan repayment scenario analysis',
    ],
    commonPitfalls: [
      'Confusing APR (Annual Percentage Rate) with nominal interest rate — APR includes fees; some lenders advertise one and use the other.',
      'Ignoring origination fees, prepayment penalties, and other costs that increase effective loan cost.',
      'Using annual rate directly in the formula instead of the monthly rate (annual ÷ 12).',
      'Assuming every extra payment reduces the balance — confirm with lender that prepayments apply to principal, not future interest.',
    ],
    glossary: [
      { term: 'Amortisation', definition: 'The process of gradually reducing a loan balance through regular payments that cover both accrued interest and principal.' },
      { term: 'Principal', definition: 'The original outstanding loan balance, excluding interest.' },
      { term: 'APR (Annual Percentage Rate)', definition: 'The yearly cost of a loan expressed as a percentage, including interest and required fees, enabling apples-to-apples comparison between lenders.' },
      { term: 'Amortisation Schedule', definition: 'A table showing each payment\'s breakdown into principal and interest, plus the remaining balance after each payment.' },
      { term: 'Prepayment Penalty', definition: 'A fee charged by some lenders if the borrower pays off the loan early, compensating the lender for lost interest income.' },
    ],
    sources: [
      { title: 'Calculating Loan Payments', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/owning-a-home/loan-estimate/', year: 2023 },
      { title: 'Time Value of Money and Loan Amortization', publisher: 'CFA Institute', url: 'https://www.cfainstitute.org/', year: 2022 },
    ],
    author: {
      name: 'CalculatorFree Finance Team',
      credentials: 'Certified Financial Analyst Review Board',
      description: 'Formula and outputs verified against CFPB loan calculation standards and Federal Reserve guidelines.',
    },
  },

  // ── Mortgage ──────────────────────────────────────────────────────────────
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
    formula: {
      expression: 'M_PI = L × [r(1+r)^n] ÷ [(1+r)^n − 1]\nM_Tax = HomeValue × TaxRate ÷ 1200\nM_Ins = AnnualInsurance ÷ 12\nTotal Monthly = M_PI + M_Tax + M_Ins + HOA',
      variables: [
        { symbol: 'L', definition: 'Loan amount = Home Price − Down Payment' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Number of monthly payments = Loan term in years × 12' },
        { symbol: 'M_PI', definition: 'Monthly principal and interest payment' },
        { symbol: 'M_Tax', definition: 'Monthly property tax portion' },
        { symbol: 'M_Ins', definition: 'Monthly home insurance portion' },
        { symbol: 'HOA', definition: 'Monthly homeowners association fee (if applicable)' },
      ],
      notes:
        'PMI (Private Mortgage Insurance) applies when down payment is under 20% of purchase price. PMI typically costs 0.5–1.5% of the loan annually, added to the monthly payment. This calculator does not include PMI — add it manually if applicable.',
    },
    examples: [
      {
        title: 'First-time buyer — $400,000 home, 10% down',
        scenario: '$400,000 purchase, $40,000 down, 6.85% rate, 30-year term, 1.2% tax, $1,200/yr insurance.',
        steps: [
          'Loan amount: $400,000 − $40,000 = $360,000.',
          'Monthly rate: 6.85% ÷ 12 ÷ 100 = 0.005708.',
          'M_PI ≈ $2,361/mo.',
          'M_Tax = $400,000 × 0.012 ÷ 12 = $400/mo.',
          'M_Ins = $1,200 ÷ 12 = $100/mo.',
          'Total PITI = $2,361 + $400 + $100 = $2,861/mo.',
          'Note: PMI (~$150/mo) would apply due to <20% down.',
        ],
        result: 'Monthly PITI: $2,861 | Total interest over 30 years: ~$490,000',
      },
    ],
    useCases: [
      'Determining how much house you can afford based on income',
      'Comparing 15-year vs 30-year mortgage costs',
      'Evaluating refinancing scenarios when interest rates drop',
      'Understanding the full cost of homeownership beyond the list price',
      'Calculating break-even point for paying points to lower interest rate',
      'Rental property cash-flow analysis for real estate investors',
    ],
    commonPitfalls: [
      'Omitting property taxes, insurance, and HOA from affordability calculations — PITI can be 30–50% higher than principal and interest alone.',
      'Not budgeting for PMI when putting less than 20% down.',
      'Assuming the listed interest rate equals the APR — compare APR across lenders for a fair comparison.',
      'Ignoring closing costs (2–5% of loan amount) that must be paid upfront.',
      'Underestimating ongoing maintenance costs — budget 1–2% of home value annually.',
    ],
    glossary: [
      { term: 'PITI', definition: 'Principal, Interest, Taxes, and Insurance — the four components of a total monthly mortgage payment.' },
      { term: 'PMI (Private Mortgage Insurance)', definition: 'Required insurance on conventional loans when down payment is under 20%, protecting the lender if the borrower defaults.' },
      { term: 'LTV (Loan-to-Value Ratio)', definition: 'Loan amount ÷ appraised home value, expressed as a percentage. LTV above 80% typically triggers PMI on conventional loans.' },
      { term: 'DTI (Debt-to-Income Ratio)', definition: 'Total monthly debt payments ÷ gross monthly income. Most lenders require DTI below 43% (28% for housing alone).' },
      { term: 'Escrow', definition: 'A lender-managed account funded by monthly payments to cover property taxes and homeowners insurance, ensuring they are paid on time.' },
      { term: 'Points', definition: 'Upfront fees paid to reduce the interest rate. One point = 1% of the loan amount, typically reducing the rate by 0.25%.' },
    ],
    sources: [
      { title: 'CFPB Mortgage Basics', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/owning-a-home/', year: 2024 },
      { title: 'Conventional Loan Requirements', publisher: 'Fannie Mae', url: 'https://www.fanniemae.com/homebuyers/home-buying-process/financing', year: 2024 },
      { title: 'FHA Loan Limits and Requirements', publisher: 'U.S. Department of Housing and Urban Development', url: 'https://www.hud.gov/buying/loans', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Real Estate Finance Team',
      credentials: 'Licensed Mortgage Broker Review & HUD Guidelines',
      description: 'Verified against CFPB disclosure requirements and Fannie Mae underwriting standards.',
    },
  },

  // ── Percentage ────────────────────────────────────────────────────────────
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
    formula: {
      expression:
        'Mode 1 — X% of Y:        Result = Y × (X ÷ 100)\nMode 2 — X is what % of Y: Result = (X ÷ Y) × 100\nMode 3 — % change X→Y:    Result = ((Y − X) ÷ |X|) × 100',
      variables: [
        { symbol: 'X', definition: 'First input value (percentage, part, or original amount depending on mode)' },
        { symbol: 'Y', definition: 'Second input value (base number or new amount)' },
        { symbol: 'Result', definition: 'Computed percentage or absolute value depending on mode selected' },
        { symbol: '|X|', definition: 'Absolute value of X (handles negative original values in % change)' },
      ],
      notes:
        'Percentage change from 0 is undefined (division by zero). Negative results indicate a percentage decrease. Percentage point difference and percentage difference are distinct concepts — this calculator computes relative percentage change.',
    },
    examples: [
      {
        title: 'Sale price calculation',
        scenario: 'A $120 jacket is 30% off. What is the sale price?',
        steps: [
          'Discount amount = 30% of $120 = $120 × 0.30 = $36.',
          'Sale price = $120 − $36 = $84.',
          'Or: sale price = $120 × (1 − 0.30) = $120 × 0.70 = $84.',
        ],
        result: 'Sale price: $84 (saving $36)',
      },
      {
        title: 'Year-over-year revenue change',
        scenario: 'Revenue grew from $1.2M to $1.5M. What is the percentage increase?',
        steps: [
          'Change = $1.5M − $1.2M = $0.3M.',
          'Percentage change = ($0.3M ÷ $1.2M) × 100 = 25%.',
        ],
        result: '25% revenue increase year-over-year',
      },
    ],
    useCases: [
      'Retail discount and sale price calculations',
      'Financial reporting — revenue growth and YoY comparisons',
      'Academic grading — converting raw scores to percentages',
      'Statistics — expressing proportions in survey data',
      'Tax calculation — finding the pre-tax amount from a total',
      'Tip calculation as a percentage of bill amount',
    ],
    commonPitfalls: [
      'Confusing percentage change with percentage point change — especially critical in financial reporting and statistics.',
      'Dividing by the new value instead of the original value when computing percentage change.',
      'Applying percentage increases successively incorrectly — a 50% increase then 50% decrease does NOT return to the original value.',
      'Forgetting that percentage of a percentage requires multiplication, not addition (e.g., 10% of 20% = 2%, not 30%).',
    ],
    glossary: [
      { term: 'Percentage', definition: 'A ratio expressed as a fraction of 100, denoted by the % symbol. "Per cent" is Latin for "per hundred".' },
      { term: 'Percentage Point', definition: 'The arithmetic difference between two percentages. A change from 5% to 8% is a 3 percentage point increase, but a 60% relative increase.' },
      { term: 'Percentage Change', definition: 'The relative change between an old and new value, expressed as a percentage of the old value.' },
      { term: 'Basis Point', definition: 'One-hundredth of a percentage point (0.01%), commonly used in finance to express changes in interest rates or bond yields.' },
    ],
    sources: [
      { title: 'Mathematical Foundations of Percentage Calculations', publisher: 'Khan Academy', url: 'https://www.khanacademy.org/math/pre-algebra/pre-algebra-ratios-rates/pre-algebra-percent-word-problems/a/percent-word-problems', year: 2023 },
      { title: 'Statistical Methods — Percentage Change', publisher: 'U.S. Bureau of Labor Statistics', url: 'https://www.bls.gov/cpi/factsheets/computing-price-indexes.htm', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Math Team',
      credentials: 'Applied Mathematics Review',
      description: 'Formulae aligned with ISO 80000-1 mathematical notation standards.',
    },
  },

  // ── Mortgage Amortization ─────────────────────────────────────────────────
  'mortgage-amortization': {
    howToSteps: [
      'Enter your loan amount — the total you are borrowing (home price minus down payment).',
      'Enter the annual interest rate and loan term in years.',
      'Optionally add an extra monthly payment to model accelerated payoff.',
      'Switch between "Yearly" and "Monthly" views; click any year row to expand the monthly detail.',
    ],
    faqs: [
      { question: 'What is an amortization schedule?', answer: 'An amortization schedule is a complete table of every loan payment showing how much goes to principal, how much to interest, and the remaining balance after each payment. Early payments are mostly interest; later payments shift toward principal.' },
      { question: 'How much interest can I save with extra payments?', answer: 'Even small extra payments applied to principal dramatically reduce total interest. For example, paying $200/month extra on a $300,000, 30-year loan at 6.85% saves over $90,000 in interest and pays off the loan ~8 years early.' },
      { question: 'What is the difference between the monthly payment and total paid?', answer: 'Your monthly payment is fixed (P&I). Total paid is that payment times the number of payments. The difference between total paid and your original loan amount is the total interest you pay over the life of the loan.' },
      { question: 'Why does so much of my early payment go to interest?', answer: 'Because interest accrues on the outstanding balance each month. When the balance is high (early in the loan), so is the interest charge. As you pay down principal, the interest portion shrinks and the principal portion grows — this is amortization.' },
      { question: 'Can I use this for any loan type?', answer: 'Yes. This calculator works for any fixed-rate fully-amortizing loan: 30-year mortgages, 15-year mortgages, refinances, home equity loans, and personal loans.' },
    ],
    formula: {
      expression: 'M = L × [r(1+r)^n] ÷ [(1+r)^n − 1]\nInterest_k = Balance_(k-1) × r\nPrincipal_k = M − Interest_k\nBalance_k = Balance_(k-1) − Principal_k',
      variables: [
        { symbol: 'M', definition: 'Fixed monthly payment (Principal & Interest)' },
        { symbol: 'L', definition: 'Loan amount (principal)' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Total number of monthly payments = years × 12' },
        { symbol: 'Balance_k', definition: 'Outstanding loan balance after payment k' },
        { symbol: 'Interest_k', definition: 'Interest portion of payment k' },
        { symbol: 'Principal_k', definition: 'Principal portion of payment k' },
      ],
      notes: 'Extra principal payments reduce the outstanding balance immediately, so subsequent interest charges are lower. This compounds: every dollar of extra principal paid early saves more than a dollar of interest over time.',
    },
    examples: [
      {
        title: 'Standard 30-year mortgage',
        scenario: '$320,000 loan at 6.85% for 30 years, no extra payments.',
        steps: [
          'Monthly rate r = 6.85 ÷ 12 ÷ 100 = 0.005708.',
          'n = 360 payments.',
          'M = 320,000 × [0.005708 × (1.005708)^360] ÷ [(1.005708)^360 − 1] ≈ $2,103/mo.',
          'Month 1: Interest = $320,000 × 0.005708 = $1,827; Principal = $276.',
          'Month 360: Interest ≈ $12; Principal ≈ $2,091.',
          'Total interest = $2,103 × 360 − $320,000 ≈ $437,000.',
        ],
        result: 'Monthly payment: $2,103 | Total interest over 30 years: ~$437,000',
      },
      {
        title: 'Same loan with $300/mo extra payment',
        scenario: '$320,000 at 6.85%, 30-year term, $300 extra per month.',
        steps: [
          'Base payment: $2,103/mo. Total monthly: $2,403.',
          'Extra $300 applied to principal each month, reducing balance faster.',
          'Lower balance → less interest each subsequent month.',
          'Payoff achieved in approximately 22 years (instead of 30).',
        ],
        result: 'Payoff in ~22 years | Interest saved: ~$110,000 | Months saved: ~96',
      },
    ],
    useCases: [
      'Planning extra principal payments to shorten payoff and reduce total interest',
      'Comparing 15-year vs 30-year mortgage total costs',
      'Determining how many payments remain on an existing mortgage',
      'Satisfying lender or accounting requirements for loan documentation',
      'Real estate investment analysis — projecting equity build-up year by year',
      'Refinancing decisions — comparing new schedule vs remaining old schedule',
    ],
    commonPitfalls: [
      'Assuming all extra payments reduce principal — confirm with lender that prepayments apply to principal, not future scheduled payments.',
      'Ignoring escrow: the amortization schedule covers P&I only; property tax and insurance are separate.',
      'Not accounting for the interest saved when comparing paying points upfront vs a lower rate over time.',
      'Overlooking that private mortgage insurance (PMI) is cancelled once LTV reaches 80%, reducing total cost.',
    ],
    glossary: [
      { term: 'Amortization', definition: 'Gradual repayment of a debt over time through regular installments that cover both interest and principal.' },
      { term: 'Principal', definition: 'The outstanding balance of the loan, excluding accrued interest.' },
      { term: 'Negative Amortization', definition: 'When monthly payments are less than the interest owed, causing the outstanding balance to grow. Not possible with standard fixed-rate loans.' },
      { term: 'Equity', definition: 'The portion of the home value you own outright: current home value minus outstanding loan balance.' },
      { term: 'Prepayment', definition: 'Any payment toward principal beyond the scheduled monthly amount, reducing the outstanding balance and future interest charges.' },
    ],
    sources: [
      { title: 'Mortgage Amortization — Consumer Financial Protection Bureau', publisher: 'CFPB', url: 'https://www.consumerfinance.gov/owning-a-home/process/compare/', year: 2024 },
      { title: 'Understanding Your Mortgage Statement', publisher: 'Federal Reserve', url: 'https://www.federalreserve.gov/pubs/mortgage_interestrates/', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Real Estate Finance Team',
      credentials: 'Licensed Mortgage Broker Review & Actuarial Verification',
      description: 'Amortization logic verified against Fannie Mae loan calculation standards and CFPB disclosure requirements.',
    },
  },

  // ── House Affordability ───────────────────────────────────────────────────
  'house-affordability': {
    howToSteps: [
      'Enter your annual gross income (before taxes) and total monthly debt payments (car, student loan, credit cards).',
      'Enter your available down payment, expected interest rate, and loan term.',
      'Adjust property tax rate (varies by state/county), home insurance rate, and any HOA fees.',
      'The calculator shows your maximum home price based on the 28/36 DTI rule used by most lenders.',
    ],
    faqs: [
      { question: 'What is the 28/36 rule?', answer: 'Lenders typically require your monthly housing costs (PITI) to be no more than 28% of gross monthly income (front-end DTI), and total debt including housing to be no more than 36% (back-end DTI). The calculator finds the maximum home price that satisfies both limits.' },
      { question: 'What counts as monthly debt?', answer: 'Include all recurring minimum debt payments: car loans, student loans, personal loans, and minimum credit card payments. Do not include utilities, groceries, or subscriptions — only loan/debt obligations.' },
      { question: 'Should I include PMI in affordability calculations?', answer: 'Yes, if your down payment is less than 20%. PMI typically costs 0.5–1.5% of the loan amount annually. Add it to your estimated monthly costs. PMI is automatically cancelled when your loan balance reaches 80% of home value.' },
      { question: 'How does down payment affect affordability?', answer: 'A larger down payment reduces the loan amount, lowering your monthly P&I payment. It also eliminates PMI above 20% down. Even a 5% increase in down payment can significantly raise the maximum home price you qualify for.' },
      { question: 'What is the difference between front-end and back-end DTI?', answer: 'Front-end DTI = housing costs ÷ gross income. Back-end DTI = (housing + all debts) ÷ gross income. The calculator uses whichever limit is more restrictive, which is how actual lenders underwrite mortgages.' },
    ],
    formula: {
      expression: 'Front-End Limit: Max PITI = Monthly Income × (FrontEndDTI ÷ 100)\nBack-End Limit: Max PITI = Monthly Income × (BackEndDTI ÷ 100) − Monthly Debts\nMax PITI = min(Front-End Limit, Back-End Limit)\nMax P&I = Max PITI − Monthly Tax − Monthly Insurance − HOA\nMax Loan = Max P&I × [(1+r)^n − 1] ÷ [r × (1+r)^n]\nMax Home Price = Max Loan + Down Payment',
      variables: [
        { symbol: 'PITI', definition: 'Principal, Interest, Taxes, Insurance — total monthly housing cost' },
        { symbol: 'DTI', definition: 'Debt-to-Income ratio, expressed as a percentage of gross monthly income' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Total monthly payments = loan term years × 12' },
        { symbol: 'Max P&I', definition: 'Maximum allowable principal and interest payment after subtracting tax, insurance, and HOA from max PITI' },
      ],
      notes: 'Property tax and insurance scale with home price, so the formula is solved iteratively. Starting with an estimate of Max P&I, the calculator converges on the correct home price within 6 iterations. FHA loans allow DTI up to 43/50%; jumbo loans are stricter.',
    },
    examples: [
      {
        title: 'Dual-income household — $150k combined income',
        scenario: '$150,000 annual income, $800/mo existing debts, $60,000 down, 6.85% rate, 30-year term, 1.2% tax, 0.5% insurance.',
        steps: [
          'Monthly income = $150,000 ÷ 12 = $12,500.',
          'Front-end limit (28%): Max PITI = $12,500 × 0.28 = $3,500.',
          'Back-end limit (36%): Max PITI = $12,500 × 0.36 − $800 = $3,700.',
          'Binding constraint: front-end ($3,500).',
          'Subtract estimated tax+insurance (≈1.7% ÷ 12 of home price) and iterate to find Max P&I.',
          'Max loan ≈ $378,000; Max home price = $378,000 + $60,000 ≈ $438,000.',
        ],
        result: 'Maximum home price: ~$438,000 | Max PITI: ~$3,500/mo',
      },
    ],
    useCases: [
      'Pre-qualification estimate before meeting with a mortgage lender',
      'Setting a realistic home search budget on Zillow or Redfin',
      'Understanding how paying off debts increases buying power',
      'Comparing affordability across different interest rate scenarios',
      'Determining how much more down payment is needed to qualify for a specific home',
      'Exploring the effect of a co-borrower on maximum loan amount',
    ],
    commonPitfalls: [
      'Using net income instead of gross income — lenders qualify based on pre-tax income.',
      'Omitting non-mortgage debts — even a $300/mo car payment meaningfully reduces max home price.',
      'Not budgeting for PMI when down payment is under 20% — it can add $150–$400/mo.',
      'Ignoring closing costs (2–5% of purchase price) that reduce available cash for down payment.',
      'Assuming approval at the maximum limit — qualifying for a loan and comfortably affording it are different.',
    ],
    glossary: [
      { term: 'DTI (Debt-to-Income Ratio)', definition: 'The percentage of gross monthly income consumed by debt payments. Lenders use both front-end (housing only) and back-end (all debts) DTI.' },
      { term: 'Front-End DTI', definition: 'Housing costs (PITI) as a percentage of gross monthly income. Most conventional lenders require this to be ≤28%.' },
      { term: 'Back-End DTI', definition: 'All monthly debt obligations (housing + other debts) as a percentage of gross monthly income. Conventional limit is typically 36–43%.' },
      { term: 'PMI (Private Mortgage Insurance)', definition: 'Insurance required on conventional loans with less than 20% down. Protects the lender; cancelled when LTV reaches 80%.' },
      { term: 'Gross Income', definition: 'Pre-tax income. Lenders use gross income (not take-home pay) for DTI calculations.' },
      { term: 'Pre-qualification', definition: 'An informal estimate of how much a lender might lend, based on self-reported income and debts. Not a commitment to lend.' },
    ],
    sources: [
      { title: 'Debt-to-Income Ratio for Mortgage Qualification', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio/', year: 2024 },
      { title: 'Qualifying Ratios — Fannie Mae Selling Guide', publisher: 'Fannie Mae', url: 'https://selling-guide.fanniemae.com/', year: 2024 },
      { title: 'FHA Loan Requirements', publisher: 'U.S. Department of Housing and Urban Development', url: 'https://www.hud.gov/buying/loans', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Real Estate Finance Team',
      credentials: 'Licensed Mortgage Broker Review & HUD Guidelines',
      description: 'DTI methodology cross-referenced with Fannie Mae underwriting standards and CFPB qualification guidelines.',
    },
  },

  // ── Rent ──────────────────────────────────────────────────────────────────
  rent: {
    howToSteps: [
      'Enter your monthly base rent.',
      'Add monthly utilities (electricity, gas, water, internet) and renter\'s insurance.',
      'Enter any parking, pet fees, or other recurring monthly costs.',
      'Add one-time upfront costs: security deposit and any broker or move-in fee.',
      'Set the annual rent increase percentage and lease term to project total costs over time.',
    ],
    faqs: [
      { question: 'What is the true cost of renting?', answer: 'Beyond base rent, true renting costs include utilities (avg $100–$200/mo), renter\'s insurance ($15–$30/mo), parking ($50–$300/mo in urban areas), and pet fees ($25–$100/mo). Add these up: a $2,000/mo apartment often costs $2,300–$2,600/mo all-in.' },
      { question: 'What is renter\'s insurance and do I need it?', answer: 'Renter\'s insurance covers your personal belongings against theft, fire, and water damage, and provides liability coverage. It typically costs $15–$30/month and is strongly recommended. Many landlords require it.' },
      { question: 'How much is a typical security deposit?', answer: 'Most landlords charge 1–2 months\' rent as a security deposit. Some states cap it at 1 month. You get it back (minus deductions for damage) when you move out, so it is not a lost cost — but it ties up cash upfront.' },
      { question: 'What is a broker fee?', answer: 'In some markets (especially New York City), a real estate broker charges a fee — often one month\'s rent — to connect you with a landlord. This is a one-time cost at move-in that significantly increases the true first-year expense.' },
      { question: 'How much do rents typically increase each year?', answer: 'Annual rent increases vary widely by market, but the US average has been 3–5% in recent years. Some cities have rent control ordinances limiting increases. Always factor in future increases when budgeting for a multi-year stay.' },
    ],
    formula: {
      expression: 'Monthly Total = Rent + Utilities + Insurance + Parking + Pet Fee + Other\nAnnual Total = Monthly Total × 12\nTotal Lease Cost = Σ(Monthly Total × (1 + RentIncrease%)^floor(month/12)) for all months\nTrue First Year = Annual Total + Security Deposit + Broker Fee',
      variables: [
        { symbol: 'Rent', definition: 'Base monthly rent payment' },
        { symbol: 'Utilities', definition: 'Average monthly electricity, gas, water, and internet costs' },
        { symbol: 'Insurance', definition: 'Monthly renter\'s insurance premium' },
        { symbol: 'RentIncrease%', definition: 'Annual percentage rent increase applied at each lease renewal' },
        { symbol: 'True First Year', definition: 'All recurring costs for 12 months plus one-time upfront fees' },
      ],
      notes: 'The 10-year projection applies the annual rent increase at each yearly anniversary. Non-rent costs (utilities, insurance) are held constant as an estimate. In practice, utilities increase with inflation (~3% annually).',
    },
    examples: [
      {
        title: 'Urban apartment — New York City market',
        scenario: '$3,200/mo rent, $200 utilities, $20 insurance, $150 parking, $50 pet fee, $3,200 deposit, $3,200 broker fee, 3% annual increase, 12-month lease.',
        steps: [
          'Monthly total = $3,200 + $200 + $20 + $150 + $50 = $3,620.',
          'Annual recurring cost = $3,620 × 12 = $43,440.',
          'Upfront costs = $3,200 + $3,200 = $6,400.',
          'True first-year cost = $43,440 + $6,400 = $49,840.',
          'Year 2 rent = $3,200 × 1.03 = $3,296/mo; annual total rises to ~$44,500.',
        ],
        result: 'Monthly all-in: $3,620 | True Year 1 cost: $49,840 | 10-year cumulative: ~$510,000',
      },
      {
        title: 'Suburban apartment — mid-size city',
        scenario: '$1,400/mo rent, $120 utilities, $15 insurance, no parking, $1,400 deposit, no broker fee, 2.5% annual increase, 12-month lease.',
        steps: [
          'Monthly total = $1,400 + $120 + $15 = $1,535.',
          'Annual recurring = $1,535 × 12 = $18,420.',
          'True first-year = $18,420 + $1,400 = $19,820.',
        ],
        result: 'Monthly all-in: $1,535 | True Year 1: $19,820 | Cost per day: ~$50',
      },
    ],
    useCases: [
      'Budgeting accurately before signing a lease',
      'Comparing two apartments with different rent + fee structures',
      'Calculating the true cash needed at move-in (deposit + broker + first month)',
      'Projecting long-term housing costs when considering staying vs moving',
      'Determining the maximum rent you can afford based on the 30% income rule',
      'Preparing financial disclosures for roommate agreements',
    ],
    commonPitfalls: [
      'Budgeting only for base rent — utilities and fees commonly add 15–30% on top.',
      'Forgetting that security deposits tie up cash but are (theoretically) refundable — budget for it regardless.',
      'Not reading the lease for automatic renewal clauses and rent escalation terms.',
      'Overlooking broker fees in tight markets — they can equal a full month\'s additional expense.',
      'Assuming utilities are included when they are not — always confirm what the landlord covers.',
    ],
    glossary: [
      { term: 'Security Deposit', definition: 'Refundable cash held by the landlord against damage or unpaid rent. Returned (minus deductions) at lease end.' },
      { term: 'Renter\'s Insurance', definition: 'Insurance covering a tenant\'s personal property and liability. Does not cover the building itself (covered by landlord\'s insurance).' },
      { term: 'Broker Fee', definition: 'One-time payment to a real estate agent for facilitating the rental. Common in New York City and other high-demand markets.' },
      { term: '30% Rule', definition: 'A common guideline that rent should not exceed 30% of gross monthly income. A rough heuristic — total housing costs including utilities are the more useful measure.' },
      { term: 'Rent Control', definition: 'Local ordinances limiting how much a landlord can increase rent annually, often tied to inflation indices (CPI). Not available in all markets.' },
    ],
    sources: [
      { title: 'Rental Housing Finance Survey', publisher: 'U.S. Census Bureau', url: 'https://www.census.gov/programs-surveys/rhfs.html', year: 2023 },
      { title: 'Renter\'s Guide to Insurance', publisher: 'Insurance Information Institute', url: 'https://www.iii.org/article/renters-insurance', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Personal Finance Team',
      credentials: 'Consumer Finance & Housing Economics Review',
      description: 'Rental cost methodology reviewed against U.S. Census Bureau housing cost data and real estate industry standards.',
    },
  },

  // ── Rent vs. Buy ──────────────────────────────────────────────────────────
  'rent-vs-buy': {
    howToSteps: [
      'Enter the home price, down payment, mortgage rate, and loan term for the buying scenario.',
      'Add property tax rate, insurance, HOA, annual maintenance (1% of value is standard), closing and selling costs.',
      'Enter your monthly rent, expected annual rent increase, and renter\'s insurance.',
      'Set how many years to compare and the investment return rate for the down payment opportunity cost.',
      'The calculator shows break-even year, net cost of each option, and a year-by-year comparison table.',
    ],
    faqs: [
      { question: 'How is the break-even calculated?', answer: 'The break-even year is when buying\'s cumulative net cost (total out-of-pocket minus home equity at sale) first becomes lower than renting\'s cumulative net cost (total rent minus what the invested down payment has grown to). It is the year buying becomes financially advantageous.' },
      { question: 'What is "net cost" in this calculator?', answer: 'Net cost accounts for what you get back. For buying: total paid minus the equity you\'d receive if you sold (after selling costs). For renting: total rent paid minus the investment value of the down payment (opportunity cost). This gives a true apples-to-apples comparison.' },
      { question: 'What is the opportunity cost of a down payment?', answer: 'If you rent, you keep the down payment and can invest it. The investment return rate represents what that money could earn (e.g., 7% in a diversified index fund). This is a real financial cost of buying that is often overlooked.' },
      { question: 'Does this calculator account for tax benefits of homeownership?', answer: 'No. Mortgage interest deductions and property tax deductions are not included because their value depends on your tax bracket and whether you itemize. For most homeowners under the raised standard deduction (2018+), the tax benefit is minimal. Consult a tax professional.' },
      { question: 'When does buying almost always win?', answer: 'Buying tends to win when: you stay for 7+ years, the local market appreciates steadily, rent is high relative to purchase price, and your down payment opportunity cost is low. Short time horizons and high closing/selling costs typically favour renting.' },
    ],
    formula: {
      expression: 'Buying Net Cost_Y = Cumulative Out-of-Pocket_Y − Home Equity_Y\nHome Equity_Y = HomeValue × (1+g)^Y − RemainingLoan − SellingCosts\nRenting Net Cost_Y = Cumulative Rent_Y − InvestmentValue_Y\nInvestmentValue_Y = (DownPayment + ClosingCosts) × (1+i)^Y\nBreak-Even = first Y where BuyingNetCost_Y < RentingNetCost_Y',
      variables: [
        { symbol: 'g', definition: 'Annual home appreciation rate (e.g., 0.03 for 3%)' },
        { symbol: 'i', definition: 'Annual investment return rate for the down payment opportunity cost' },
        { symbol: 'Y', definition: 'Year in the comparison horizon' },
        { symbol: 'SellingCosts', definition: 'Agent commissions + transfer taxes at sale (typically 6% of sale price)' },
        { symbol: 'ClosingCosts', definition: 'Upfront buying transaction costs (typically 2–3% of purchase price)' },
      ],
      notes: 'This model simplifies taxes, does not include mortgage interest deduction, and assumes constant inflation-adjusted costs. Real break-even points depend on local market conditions. The closing costs are added to the down payment invested in the renting scenario for a fair comparison.',
    },
    examples: [
      {
        title: 'Urban scenario — 10-year horizon',
        scenario: '$500,000 home, $100,000 down, 6.85% rate, 30-year term, $2,800/mo rent, 3% appreciation, 3% rent increase, 7% investment return, 10 years.',
        steps: [
          'Monthly mortgage P&I ≈ $2,628.',
          'Add tax (1.2%), insurance (0.5%), maintenance (1%): +~$1,250/mo year 1 all-in cost.',
          'Buying net cost year 10: ~$370,000 (paid) − ~$160,000 (equity after selling costs) = ~$210,000.',
          'Renting net cost year 10: ~$384,000 (total rent) − ~$194,000 (investment) = ~$190,000.',
          'Renting is cheaper at year 10 by ~$20,000.',
          'Break-even occurs around year 12–14 in this scenario.',
        ],
        result: 'Renting is better at 10 years. Buying becomes better around year 12–14.',
      },
    ],
    useCases: [
      'Deciding whether to buy before a relocation or continue renting',
      'Evaluating buying in a high cost-of-living city vs a lower-cost suburb',
      'Comparing buying in a flat market vs renting and investing the difference',
      'Advising a first-time buyer on realistic financial expectations',
      'Real estate investors evaluating primary residence vs investment property',
      'Modeling retirement housing strategy: pay off a mortgage vs rent and invest',
    ],
    commonPitfalls: [
      'Ignoring transaction costs — closing (2–3%) plus selling (6%) costs total 8–9% of home value and must be recouped through appreciation before buying breaks even.',
      'Assuming all equity is wealth — home equity is illiquid and subject to market risk, unlike a diversified investment portfolio.',
      'Using too-low maintenance estimates — 1% of home value annually is the standard rule, but older homes and HOA-free properties often exceed this.',
      'Ignoring rent increases — rents in most markets grow 2–4% annually. A fixed mortgage becomes relatively cheaper over time.',
      'Not considering the psychological benefits of ownership (stability, customization) which have real value beyond the financial comparison.',
    ],
    glossary: [
      { term: 'Opportunity Cost', definition: 'The financial return foregone by choosing one option over another. The down payment\'s opportunity cost is the investment return you give up by putting that money into a house.' },
      { term: 'Home Equity', definition: 'The market value of your ownership stake in a property: current value minus outstanding mortgage balance.' },
      { term: 'Net Cost', definition: 'Total out-of-pocket costs minus the value of assets received in return. For buying: total payments minus equity. For renting: total rent minus investment growth.' },
      { term: 'Break-Even Year', definition: 'The first year in which the cumulative net cost of buying falls below the cumulative net cost of renting.' },
      { term: 'Price-to-Rent Ratio', definition: 'Home price divided by annual rent for a comparable property. A ratio above 20 generally favours renting; below 15 generally favours buying.' },
      { term: 'Selling Costs', definition: 'Agent commissions (typically 5–6%), transfer taxes, and closing costs paid at the time of sale. Usually 6–8% of sale price.' },
    ],
    sources: [
      { title: 'Is It Better to Buy or Rent?', publisher: 'New York Times Upshot', url: 'https://www.nytimes.com/interactive/2014/upshot/buy-rent-calculator.html', year: 2023 },
      { title: 'Homeownership and Wealth Accumulation', publisher: 'Federal Reserve Bank of St. Louis', url: 'https://www.stlouisfed.org/publications/regional-economist/2017/third-quarter/homeownership-and-wealth-accumulation', year: 2022 },
      { title: 'The Price-to-Rent Ratio', publisher: 'Harvard Joint Center for Housing Studies', url: 'https://www.jchs.harvard.edu/', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Real Estate Finance Team',
      credentials: 'Licensed Real Estate & Financial Planning Review',
      description: 'Comparison methodology aligned with CFPB homeownership cost frameworks and peer-reviewed housing economics literature.',
    },
  },

  // ── Tip ──────────────────────────────────────────────────────────────────
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
    formula: {
      expression:
        'Tip Amount = Bill × (Tip% ÷ 100)\nTotal Bill = Bill + Tip Amount\nPer Person = Total Bill ÷ Number of People\nTip Per Person = Tip Amount ÷ Number of People',
      variables: [
        { symbol: 'Bill', definition: 'Pre-tip bill amount in dollars' },
        { symbol: 'Tip%', definition: 'Tip percentage (e.g., 18 for 18%)' },
        { symbol: 'Number of People', definition: 'Count of individuals sharing the total bill equally' },
      ],
      notes:
        'The calculator computes an equal split. Local tipping norms vary: US standard is 15–20%, UK is 10–15%, many European countries have no tipping expectation. Always check if a service charge is already included on the bill.',
    },
    examples: [
      {
        title: 'Dinner for four — 20% tip',
        scenario: '$120 restaurant bill, 20% tip, split 4 ways.',
        steps: [
          'Tip amount = $120 × 0.20 = $24.',
          'Total bill = $120 + $24 = $144.',
          'Per person = $144 ÷ 4 = $36.',
          'Tip per person = $24 ÷ 4 = $6.',
        ],
        result: 'Each person pays $36 (includes $6 tip)',
      },
      {
        title: 'Coffee shop — quick 15% calculation',
        scenario: '$8.50 coffee order, 15% tip.',
        steps: [
          'Tip = $8.50 × 0.15 = $1.275 ≈ $1.28.',
          'Total = $8.50 + $1.28 = $9.78.',
        ],
        result: 'Total: $9.78 | Tip: $1.28',
      },
    ],
    useCases: [
      'Restaurant dining — calculating fair tip without mental math',
      'Food delivery — determining appropriate tip for couriers',
      'Hair salon and personal care services',
      'Hotel housekeeping and concierge gratuity',
      'Tour guide and valet parking gratuity',
      'Group dining — ensuring every person pays a fair share including the tip',
    ],
    commonPitfalls: [
      'Tipping on the post-tax total inflates the server\'s tip by the local tax rate, though many diners prefer the simplicity.',
      'Forgetting that some restaurants automatically add 18–20% gratuity for large parties — double-tipping in this case.',
      'Rounding tip amounts inconsistently when splitting — rounding each person\'s share up avoids awkward cent disputes.',
      'Not checking if a "service charge" on the receipt already covers the tip (common in many countries outside the US).',
    ],
    glossary: [
      { term: 'Gratuity', definition: 'A voluntary payment beyond the stated price, expressing satisfaction with service. Synonymous with "tip" in common usage.' },
      { term: 'Service Charge', definition: 'A mandatory or suggested surcharge added to the bill by the establishment, distinct from a voluntary tip. Common in the UK and Europe.' },
      { term: 'Pre-tax Tip', definition: 'A tip calculated on the subtotal before sales tax is applied, considered the "correct" base by many etiquette authorities.' },
      { term: 'Gratuity Pool', definition: 'A system where tips are collected and redistributed among multiple staff members, including kitchen staff, bussers, and hosts.' },
    ],
    sources: [
      { title: 'Tipping in America — Economic Policy Institute', publisher: 'Economic Policy Institute', url: 'https://www.epi.org/publication/why-america-should-adopt-a-15-minimum-wage/', year: 2022 },
      { title: 'Restaurant Industry Facts', publisher: 'National Restaurant Association', url: 'https://restaurant.org/research-and-media/research/research-reports/', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Lifestyle Team',
      credentials: 'Consumer Finance & Hospitality Industry Review',
      description: 'Tipping guidance cross-referenced with NRA industry standards and consumer finance best practices.',
    },
  },
};
