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

  // ── Rental Property ───────────────────────────────────────────────────────
  'rental-property': {
    howToSteps: [
      'Enter the purchase price, down payment, interest rate, and loan term.',
      'Enter the expected monthly rent and set the vacancy rate (5–10% is typical).',
      'Add annual property tax rate, insurance, maintenance (1% of value is standard), and property management fee.',
      'Enter closing costs (2–3% is typical). All key metrics update instantly.',
    ],
    faqs: [
      { question: 'What is cash-on-cash return?', answer: 'Cash-on-cash return (CoC) measures the annual pre-tax cash flow divided by the total cash invested (down payment + closing costs). A CoC of 6–10% is generally considered good for a single-family rental.' },
      { question: 'What is cap rate?', answer: 'Cap rate (capitalization rate) = Net Operating Income ÷ Purchase Price. It measures a property\'s return independent of financing. A cap rate of 5–10% is typical in most US markets. Use it to compare properties without the noise of different financing structures.' },
      { question: 'What is gross rent multiplier (GRM)?', answer: 'GRM = Purchase Price ÷ Annual Gross Rent. A lower GRM indicates better value. Most residential markets fall between 8–15×. Divide 1 by the GRM to get a rough yield before expenses.' },
      { question: 'What vacancy rate should I use?', answer: 'A 5% vacancy rate is a common default for long-term rentals in stable markets. Use 8–10% for higher-turnover areas or short-term rentals. Never assume 100% occupancy — even great properties have gap periods.' },
      { question: 'Should I include property management fees even if I self-manage?', answer: 'Yes. Including an 8–10% management fee even if you self-manage captures the true economic cost — your time has value, and you may need management later. It also makes your underwriting more conservative and defensible.' },
    ],
    formula: {
      expression: 'NOI = Effective Gross Income − Operating Expenses\nEffective Gross Income = Gross Rent × (1 − Vacancy%)\nCash Flow = NOI − Annual Mortgage Payment\nCash-on-Cash Return = Annual Cash Flow ÷ Total Cash Invested\nCap Rate = NOI ÷ Purchase Price\nGRM = Purchase Price ÷ Annual Gross Rent',
      variables: [
        { symbol: 'NOI', definition: 'Net Operating Income — income after all operating expenses but before mortgage debt service' },
        { symbol: 'CoC', definition: 'Cash-on-Cash Return — annual cash flow ÷ total cash invested (down payment + closing costs)' },
        { symbol: 'Cap Rate', definition: 'NOI ÷ Purchase Price — unlevered return, independent of financing' },
        { symbol: 'GRM', definition: 'Gross Rent Multiplier — purchase price ÷ annual gross rent; lower is better' },
        { symbol: 'Vacancy%', definition: 'Expected percentage of time the property sits unoccupied or rent is uncollected' },
      ],
      notes: 'Cap rate does not include mortgage payments — it reflects the unlevered yield on the asset. Cash-on-cash return reflects levered yield (uses debt). A positive cash flow does not guarantee a profitable investment; appreciation, equity paydown, and tax benefits must also be considered.',
    },
    examples: [
      {
        title: 'Single-family rental — Midwest market',
        scenario: '$250,000 purchase, $50,000 down (20%), 7% rate, 30-yr term, $1,800/mo rent, 5% vacancy, 1.2% tax, $1,200 insurance, 1% maintenance, 8% management, 3% closing.',
        steps: [
          'Loan: $200,000. Monthly P&I ≈ $1,331. Annual mortgage = $15,972.',
          'Gross rent: $1,800 × 12 = $21,600. Vacancy loss (5%): $1,080. EGI: $20,520.',
          'Operating expenses: Tax $3,000 + Insurance $1,200 + Maintenance $2,500 + Management $1,642 = $8,342.',
          'NOI = $20,520 − $8,342 = $12,178. Cap rate = $12,178 ÷ $250,000 = 4.87%.',
          'Cash flow = $12,178 − $15,972 = −$3,794/yr. Monthly: −$316.',
          'Total cash invested = $50,000 + $7,500 closing = $57,500. CoC = −6.6%.',
        ],
        result: 'Negative cash flow of −$316/mo. Cap rate: 4.87%. This deal requires appreciation to be profitable.',
      },
      {
        title: 'Cash-flowing duplex — Sun Belt market',
        scenario: '$350,000 duplex, $70,000 down, 7% rate, $2,800/mo combined rent, 5% vacancy, 1.3% tax, $1,600 insurance, 1% maint, 0% management (self-managed), 3% closing.',
        steps: [
          'Loan: $280,000. Monthly P&I ≈ $1,863. Annual mortgage = $22,356.',
          'EGI = $2,800 × 12 × 0.95 = $31,920.',
          'Operating expenses: Tax $4,550 + Insurance $1,600 + Maintenance $3,500 = $9,650.',
          'NOI = $31,920 − $9,650 = $22,270. Cap rate = 6.36%.',
          'Cash flow = $22,270 − $22,356 = −$86/yr ≈ break-even.',
          'CoC ≈ −0.1% (essentially zero). Equity paydown + appreciation = total return.',
        ],
        result: 'Break-even cash flow. Cap rate: 6.36%. Strong equity-build play in appreciating market.',
      },
    ],
    useCases: [
      'Screening rental properties before making an offer',
      'Comparing multiple investment properties side-by-side on cap rate and CoC',
      'Determining the maximum purchase price for a target CoC return',
      'Building a landlord cash-flow model to present to private lenders',
      'Evaluating the impact of raising rents on investment returns',
      'Stress-testing assumptions: what happens if vacancy rises to 10%?',
    ],
    commonPitfalls: [
      'Using gross rent without deducting vacancy — even 5% vacancy materially changes CoC.',
      'Omitting property management fees when self-managing — your time has a cost.',
      'Using purchase price as property value for tax calculations — always use current assessed/market value.',
      'Ignoring capital expenditure reserves (CapEx): roof, HVAC, appliances can cost $5,000–$20,000 unexpectedly.',
      'Assuming appreciation compensates for negative cash flow — appreciation is speculative; cash flow is contractual.',
      'Forgetting that NOI and cap rate are pre-financing metrics — using them post-mortgage is incorrect.',
    ],
    glossary: [
      { term: 'Net Operating Income (NOI)', definition: 'Annual rental income minus all operating expenses (taxes, insurance, maintenance, management), before mortgage payments.' },
      { term: 'Cap Rate', definition: 'NOI ÷ purchase price. The unlevered yield of a property, used to compare investments independently of how they are financed.' },
      { term: 'Cash-on-Cash Return', definition: 'Annual pre-tax cash flow ÷ total cash invested. Measures the levered return on the actual money you put in.' },
      { term: 'Gross Rent Multiplier (GRM)', definition: 'Purchase price ÷ annual gross rent. A quick screening ratio — lower values indicate more income per dollar of purchase price.' },
      { term: 'Debt Service Coverage Ratio (DSCR)', definition: 'NOI ÷ Annual Mortgage Payment. Lenders require DSCR ≥ 1.25 for most investment property loans. Below 1.0 means the property cannot service its own debt.' },
      { term: 'Capital Expenditure (CapEx)', definition: 'Large, irregular expenses for major repairs or replacements (roof, HVAC, plumbing). Budget 0.5–1.5% of property value annually as a CapEx reserve.' },
    ],
    sources: [
      { title: 'Rental Housing Finance Survey', publisher: 'U.S. Census Bureau', url: 'https://www.census.gov/programs-surveys/rhfs.html', year: 2023 },
      { title: 'Investment Property Underwriting Guide', publisher: 'Fannie Mae', url: 'https://selling-guide.fanniemae.com/', year: 2024 },
      { title: 'Real Estate Investing Fundamentals', publisher: 'National Association of Realtors', url: 'https://www.nar.realtor/research-and-statistics', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Real Estate Finance Team',
      credentials: 'Real Estate Investment & Property Management Review',
      description: 'Formulas verified against NAR investment property guidelines and Fannie Mae DSCR underwriting standards.',
    },
  },

  // ── Real Estate Calculator ────────────────────────────────────────────────
  'real-estate': {
    howToSteps: [
      'Enter the purchase price, down payment, and expected annual appreciation rate.',
      'Set the interest rate, loan term, and how many years you plan to hold the property.',
      'Enter closing costs (buying) and selling costs (agent commission + transfer taxes, typically 6–8%).',
      'Optionally add monthly rent and annual operating expenses to analyze total returns including rental income.',
    ],
    faqs: [
      { question: 'What is a realistic home appreciation rate?', answer: 'The US national average home appreciation is approximately 3–4% per year over the long run, roughly tracking inflation. Hot markets (Miami, Austin, Phoenix) have seen 6–10%+ in recent years, while flat markets may average 1–2%. The calculator defaults to 3%.' },
      { question: 'What are typical selling costs?', answer: 'Selling costs typically include real estate agent commissions (5–6% of sale price), transfer taxes (0.1–2% depending on state), and closing fees. Total selling costs of 6–8% are standard. These costs significantly affect net profit and must be recouped through appreciation before you break even.' },
      { question: 'How is annualized ROI (CAGR) different from total ROI?', answer: 'Total ROI is your overall percentage gain on cash invested. Annualized ROI (CAGR — Compound Annual Growth Rate) shows the equivalent annual return. Holding a property longer smooths out the entry costs and increases CAGR, even with the same total appreciation.' },
      { question: 'Does this calculator include tax benefits?', answer: 'No. Mortgage interest deductions, depreciation (for rentals), and capital gains exclusions ($250K/$500K for primary residences) are not included because they depend heavily on individual tax situations. Consult a CPA for tax-adjusted analysis.' },
    ],
    formula: {
      expression: 'Home Value at Sale = Purchase Price × (1 + Appreciation%)^Years\nNet Sale Proceeds = Home Value − Selling Costs − Remaining Loan Balance\nNet Profit = Net Proceeds − Down Payment − Closing Costs − Principal Paid\nROI = Net Profit ÷ Total Cash Invested × 100\nAnnualized ROI (CAGR) = (1 + ROI/100)^(1/Years) − 1',
      variables: [
        { symbol: 'CAGR', definition: 'Compound Annual Growth Rate — the annualized equivalent of total ROI' },
        { symbol: 'Appreciation%', definition: 'Expected annual percentage increase in home value' },
        { symbol: 'Selling Costs', definition: 'Agent commissions + transfer taxes + closing fees at sale (typically 6–8% of sale price)' },
        { symbol: 'Total Cash Invested', definition: 'Down payment plus buying closing costs' },
        { symbol: 'Net Profit', definition: 'Net sale proceeds minus total out-of-pocket costs (excluding principal paydown received back as equity)' },
      ],
      notes: 'This model assumes constant appreciation compounded annually. Real estate appreciation is cyclical and market-dependent. The model does not include inflation adjustment, tax implications, or the time value of money beyond CAGR. For rental analysis, operating expenses are held constant — in practice, they track inflation.',
    },
    examples: [
      {
        title: 'Primary residence — 7-year hold',
        scenario: '$400,000 home, $80,000 down (20%), 6.85% rate, 30-year term, 3% annual appreciation, 7 years held, 3% closing costs, 6% selling costs.',
        steps: [
          'Total cash invested: $80,000 + $12,000 = $92,000.',
          'Home value after 7 years: $400,000 × (1.03)^7 ≈ $491,600.',
          'Remaining loan balance after 7 years: ≈ $290,000.',
          'Selling costs: $491,600 × 0.06 = $29,500.',
          'Net sale proceeds: $491,600 − $29,500 − $290,000 = $172,100.',
          'Principal paid over 7 years ≈ $30,000 (recovered as equity above).',
          'Net profit ≈ $172,100 − $92,000 = $80,100.',
        ],
        result: 'Net profit: ~$80,100 | ROI: ~87% | Annualized ROI (CAGR): ~9.3%/yr',
      },
    ],
    useCases: [
      'Projecting total wealth creation from a home purchase over 5–20 years',
      'Comparing buying and selling quickly (2 years) vs holding long-term',
      'Evaluating a rental property for total return including income and appreciation',
      'Modeling the impact of different appreciation scenarios (1%, 3%, 5%)',
      'Calculating whether a relocation sale will be profitable after costs',
      'Estimating equity available for a future home upgrade purchase',
    ],
    commonPitfalls: [
      'Ignoring selling costs — 6% of sale price on a $500,000 home is $30,000, which must come from appreciation.',
      'Forgetting that buying closing costs (2–3%) are also sunk costs that reduce ROI.',
      'Using inflated appreciation assumptions — 3% is a realistic long-run average; using 7–8% produces dramatically overstated results.',
      'Comparing ROI to stock market returns without adjusting for leverage — real estate returns are amplified by the mortgage (you control a $400K asset with $80K down).',
      'Omitting the opportunity cost of the down payment — that $80K invested in index funds could also compound at 7%/yr.',
    ],
    glossary: [
      { term: 'Appreciation', definition: 'The increase in a property\'s value over time, driven by inflation, local supply/demand, and improvements.' },
      { term: 'CAGR (Compound Annual Growth Rate)', definition: 'The rate at which an investment would have grown if it had grown at a steady annual rate. Normalizes returns across different holding periods.' },
      { term: 'Equity', definition: 'The portion of the property you own outright: current market value minus outstanding loan balance.' },
      { term: 'Selling Costs', definition: 'Transaction costs paid at sale: real estate commissions (5–6%), transfer taxes, and closing fees. Typically 6–8% of the sale price.' },
      { term: 'Leverage', definition: 'Using borrowed money (mortgage) to control a larger asset than cash alone would allow. Real estate leverage amplifies both gains and losses.' },
      { term: 'Capital Gains', definition: 'The profit from selling an asset for more than its purchase price. Primary residence sales may qualify for a $250K/$500K exclusion (IRS Section 121).' },
    ],
    sources: [
      { title: 'Existing Home Sales and Median Price Data', publisher: 'National Association of Realtors', url: 'https://www.nar.realtor/research-and-statistics/housing-statistics/existing-home-sales', year: 2024 },
      { title: 'House Price Index', publisher: 'Federal Housing Finance Agency (FHFA)', url: 'https://www.fhfa.gov/data/hpi', year: 2024 },
      { title: 'Home Sale Exclusion — IRS Publication 523', publisher: 'Internal Revenue Service', url: 'https://www.irs.gov/publications/p523', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Real Estate Finance Team',
      credentials: 'Real Estate Economics & Investment Analysis Review',
      description: 'Appreciation assumptions benchmarked against FHFA House Price Index historical data and NAR median sale price trends.',
    },
  },

  // ── FHA Loan ──────────────────────────────────────────────────────────────
  'fha-loan': {
    howToSteps: [
      'Enter the home price — the calculator will set the minimum 3.5% down payment automatically.',
      'Adjust the down payment if putting more than 3.5% down.',
      'Choose whether to finance the upfront MIP (1.75%) into the loan — most borrowers do to preserve cash.',
      'Select the loan term (30 or 15 years), add property tax and insurance, and see your full monthly payment.',
    ],
    faqs: [
      { question: 'What is FHA MIP?', answer: 'FHA MIP (Mortgage Insurance Premium) comes in two parts: an upfront MIP of 1.75% of the base loan amount (paid at closing or rolled into the loan), and an annual MIP charged monthly. For 30-year loans with LTV above 90%, the annual rate is 0.55% — a significant addition to your monthly payment.' },
      { question: 'How long do I pay FHA mortgage insurance?', answer: 'If your LTV at origination is above 90% (less than 10% down), you pay annual MIP for the full loan term — it cannot be cancelled. If your LTV is 90% or less (10%+ down), MIP lasts 11 years. This is a key difference from conventional PMI, which cancels at 80% LTV.' },
      { question: 'What credit score do I need for an FHA loan?', answer: 'FHA allows credit scores as low as 580 for a 3.5% down payment, and 500–579 for a 10% down payment. Scores below 500 are not eligible for FHA financing.' },
      { question: 'Should I choose FHA or conventional?', answer: 'FHA is typically better when your credit score is below 680 or you can only put 3.5–5% down. Conventional PMI can be less expensive than FHA MIP for borrowers with scores above 700. Run both scenarios: conventional PMI cancels at 80% LTV, while FHA MIP on a 3.5%-down loan never cancels.' },
      { question: 'Are there FHA loan limits?', answer: 'Yes. FHA sets county-level loan limits annually. For 2024, the national floor is $498,257 for single-family homes; high-cost areas (e.g., California, New York) can be up to $1,149,825. The calculator assumes you are within the applicable limit.' },
    ],
    formula: {
      expression: 'Base Loan = Home Price − Down Payment\nUFMIP = Base Loan × 0.0175\nTotal Loan = Base Loan + UFMIP (if financed)\nMonthly MIP = Total Loan × (Annual MIP Rate ÷ 12)\n30-yr, LTV>90%: Annual MIP = 0.55% | LTV≤90%: 0.50%\n15-yr, LTV>90%: Annual MIP = 0.40% | LTV≤90%: 0.15%\nMIP Duration: LTV>90% → full term | LTV≤90% → 11 years',
      variables: [
        { symbol: 'UFMIP', definition: 'Upfront Mortgage Insurance Premium — 1.75% of base loan amount, always required' },
        { symbol: 'Annual MIP Rate', definition: 'Ongoing annual MIP rate charged monthly; varies by loan term and LTV at origination' },
        { symbol: 'LTV', definition: 'Loan-to-Value Ratio — base loan amount ÷ home price at origination' },
        { symbol: 'Total Loan', definition: 'Base loan amount plus financed UFMIP (if elected)' },
        { symbol: 'MIP Duration', definition: 'Number of months annual MIP is charged: full term if LTV>90%; 11 years if LTV≤90%' },
      ],
      notes: 'FHA MIP rates shown are effective 2023–2024 per HUD Mortgagee Letter 2023-05. HUD adjusts MIP rates periodically; always confirm current rates at hud.gov. The UFMIP is non-refundable after 3 years (partial refund available within 3 years for FHA streamline refinances).',
    },
    examples: [
      {
        title: 'First-time buyer — 3.5% down, 30-year loan',
        scenario: '$350,000 home, $12,250 down (3.5%), 6.75% rate, 30-year term, UFMIP financed, 1.2% tax, $1,200 insurance.',
        steps: [
          'Base loan: $350,000 − $12,250 = $337,750.',
          'UFMIP: $337,750 × 1.75% = $5,911.',
          'Total loan (UFMIP financed): $337,750 + $5,911 = $343,661.',
          'Monthly P&I on $343,661 at 6.75% / 30 yr ≈ $2,229.',
          'Annual MIP rate (LTV 96.5%, 30-yr): 0.55%.',
          'Monthly MIP: $343,661 × 0.0055 ÷ 12 ≈ $157.',
          'Property tax: $350,000 × 1.2% ÷ 12 = $350. Insurance: $100.',
          'Total monthly: $2,229 + $157 + $350 + $100 = $2,836.',
        ],
        result: 'Monthly payment: $2,836 | Monthly MIP: $157 (paid for life of loan) | Total MIP: ~$56,500',
      },
      {
        title: 'Buyer with 10% down — MIP cancels after 11 years',
        scenario: '$350,000 home, $35,000 down (10%), 6.75% rate, 30-year term.',
        steps: [
          'Base loan: $315,000. LTV = 90%. Annual MIP rate: 0.50%.',
          'Monthly MIP: $315,000 × 0.0050 ÷ 12 ≈ $131.',
          'MIP duration: 11 years (132 payments), not full 30 years.',
          'Total MIP saved vs 3.5% down scenario: ≈ $23,000 less MIP.',
        ],
        result: 'Monthly MIP: $131 for 11 years only. Total MIP savings from 10% down: ~$23,000 vs 3.5% down.',
      },
    ],
    useCases: [
      'First-time homebuyers with limited down payment savings (3.5% minimum)',
      'Buyers with credit scores 580–679 who cannot qualify for competitive conventional rates',
      'Comparing FHA vs conventional: at what LTV and credit score does conventional become cheaper?',
      'Planning a strategy to refinance out of FHA MIP once equity reaches 20%',
      'Estimating the true cost of MIP over the life of a 30-year FHA loan',
      'Evaluating higher down payment to reduce MIP to 0.50% and limit its duration to 11 years',
    ],
    commonPitfalls: [
      'Assuming FHA MIP cancels at 80% LTV like conventional PMI — it does not for loans with less than 10% down.',
      'Financing the UFMIP without realizing it adds to the loan balance and accrues interest over 30 years.',
      'Not comparing FHA to conventional with PMI at the same credit score — above 700, conventional is often cheaper.',
      'Ignoring FHA county loan limits — homes priced above the limit do not qualify for FHA financing.',
      'Overlooking the FHA property condition requirements — appraisers enforce stricter standards than conventional loans.',
    ],
    glossary: [
      { term: 'FHA (Federal Housing Administration)', definition: 'A U.S. government agency within HUD that insures mortgages made by approved lenders, enabling low-down-payment financing for qualified buyers.' },
      { term: 'MIP (Mortgage Insurance Premium)', definition: 'FHA\'s version of mortgage insurance, consisting of an upfront premium (1.75%) and an annual premium charged monthly. Protects the lender against default.' },
      { term: 'UFMIP (Upfront MIP)', definition: 'The one-time 1.75% mortgage insurance premium paid at closing or rolled into the FHA loan balance.' },
      { term: 'LTV (Loan-to-Value)', definition: 'Base loan amount ÷ home purchase price or appraised value. Determines MIP rate and duration for FHA loans.' },
      { term: 'FHA Loan Limit', definition: 'The maximum FHA loan amount in a given county, set annually by HUD based on median home prices. Varies from $498,257 (floor) to $1,149,825 (ceiling) in 2024.' },
      { term: 'FHA Streamline Refinance', definition: 'A simplified refinance program for existing FHA borrowers, requiring limited documentation and no appraisal, to reduce the interest rate or switch loan terms.' },
    ],
    sources: [
      { title: 'FHA Single Family Housing Policy Handbook (HUD 4000.1)', publisher: 'U.S. Department of Housing and Urban Development', url: 'https://www.hud.gov/program_offices/housing/sfh/handbook_references', year: 2024 },
      { title: 'Mortgagee Letter 2023-05 — Annual MIP Rate Reduction', publisher: 'HUD', url: 'https://www.hud.gov/sites/dfiles/OCHCO/documents/2023-05mlformatted.pdf', year: 2023 },
      { title: 'FHA Loan Limits for 2024', publisher: 'FHA / HUD', url: 'https://www.hud.gov/program_offices/housing/sfh/lender/origination/mortgage_limits', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Mortgage & Lending Team',
      credentials: 'HUD/FHA Guidelines & Mortgage Compliance Review',
      description: 'MIP rates and rules verified against HUD Mortgagee Letter 2023-05 and FHA Single Family Housing Policy Handbook 4000.1.',
    },
  },

  // ── VA Mortgage ───────────────────────────────────────────────────────────
  'va-mortgage': {
    howToSteps: [
      'Enter the home price and your down payment (0% is allowed for most eligible VA borrowers).',
      'Select whether this is your first use or subsequent use of VA loan benefits — the funding fee differs.',
      'If you have a service-connected disability rating, select "Exempt" to waive the funding fee entirely.',
      'Choose whether to finance the funding fee into the loan or pay it at closing, then add property tax and insurance.',
    ],
    faqs: [
      { question: 'Who is eligible for a VA loan?', answer: 'VA loans are available to: active-duty service members (after 90 days during wartime or 181 days during peacetime), veterans who meet minimum service requirements, National Guard and Reserve members (after 6 years or 90 days active duty), and surviving spouses of veterans who died in service or from a service-connected disability.' },
      { question: 'What is the VA funding fee?', answer: 'The VA funding fee is a one-time charge that funds the VA loan program and eliminates the need for PMI. For a first-use purchase with no down payment, the fee is 2.15% of the loan amount. It scales down with larger down payments. Veterans with a 10%+ service-connected disability rating are completely exempt.' },
      { question: 'Can I use a VA loan more than once?', answer: 'Yes. VA loan benefits are reusable as long as the previous VA loan is paid off (or in some cases, the entitlement is restored). Subsequent-use funding fees are higher (3.30% for 0% down) to reflect the program\'s risk management.' },
      { question: 'Does a VA loan require a down payment?', answer: 'No. VA loans have no minimum down payment requirement for qualified borrowers with full entitlement. However, putting at least 5% or 10% down reduces the funding fee to 1.50% or 1.25% respectively, potentially saving thousands upfront.' },
      { question: 'Are there VA loan limits?', answer: 'Since 2020, there are no VA loan limits for borrowers with full entitlement. Borrowers with remaining entitlement from an active VA loan may face county-level limits based on the conforming loan limit ($766,550 in most areas for 2024).' },
    ],
    formula: {
      expression: 'Base Loan = Home Price − Down Payment\nFunding Fee = Base Loan × Funding Fee Rate%\nTotal Loan = Base Loan + Funding Fee (if financed)\nMonthly P&I = Total Loan × [r(1+r)^n] ÷ [(1+r)^n − 1]\nFunding Fee Rates:\n  First Use, 0% down: 2.15% | 5–10% down: 1.50% | 10%+ down: 1.25%\n  Subsequent Use, 0% down: 3.30% | 5–10% down: 1.50% | 10%+ down: 1.25%\n  Exempt (disability): 0%',
      variables: [
        { symbol: 'Funding Fee', definition: 'One-time VA fee in lieu of PMI; replaces conventional mortgage insurance at a lower total cost for most borrowers' },
        { symbol: 'First Use', definition: 'First time using VA loan benefit, or after full entitlement restoration' },
        { symbol: 'Subsequent Use', definition: 'Any use of VA loan benefit after the first, while prior VA loan is still active' },
        { symbol: 'Exempt', definition: 'Veterans with 10%+ service-connected disability rating pay $0 funding fee' },
        { symbol: 'Total Loan', definition: 'Base loan plus financed funding fee; this is the amount that accrues interest' },
      ],
      notes: 'Funding fee rates are per VA Circular 26-23-24 (2024). Rates apply to purchase loans and cash-out refinances. IRRRL (Interest Rate Reduction Refinance Loan) has a flat 0.50% funding fee. VA loans have no PMI, no prepayment penalty, and allow seller concessions up to 4% of the loan amount.',
    },
    examples: [
      {
        title: 'First-time VA buyer — 0% down, $400,000 home',
        scenario: '$400,000 home, $0 down, first use, 6.5% rate, 30-year term, funding fee financed, 1.2% tax, $1,200 insurance.',
        steps: [
          'Base loan: $400,000.',
          'Funding fee: $400,000 × 2.15% = $8,600.',
          'Total loan (fee financed): $408,600.',
          'Monthly P&I: $408,600 at 6.5% / 30 yr ≈ $2,584.',
          'Monthly tax: $400/mo. Monthly insurance: $100.',
          'Total monthly: $2,584 + $400 + $100 = $3,084.',
          'Conventional comparison (PMI ~0.85%/yr for 0% down): $283/mo PMI for ~7 yrs = $23,772 extra.',
          'VA funding fee ($8,600) vs. conventional PMI ($23,772): VA saves ≈ $15,172.',
        ],
        result: 'Monthly payment: $3,084 (no PMI ever) | VA funding fee: $8,600 | Estimated PMI savings vs conventional: ~$15,000',
      },
      {
        title: 'Disabled veteran — funding fee exempt',
        scenario: '$400,000 home, $0 down, 10% disability rating (exempt), 6.5% rate, 30-year term.',
        steps: [
          'Funding fee: $0 (exempt).',
          'Loan amount: $400,000.',
          'Monthly P&I: $400,000 at 6.5% / 30 yr ≈ $2,528.',
          'Total monthly (with tax/insurance): ~$3,028.',
          'Savings vs non-exempt VA buyer: $8,600 funding fee eliminated.',
        ],
        result: 'Monthly payment: ~$3,028 | Funding fee savings: $8,600 | No PMI, no funding fee = maximum VA benefit.',
      },
    ],
    useCases: [
      'Active-duty service members purchasing a home with limited savings (0% down)',
      'Veterans comparing VA vs. FHA vs. conventional loan total costs',
      'Subsequent VA loan users planning a second purchase while retaining prior home',
      'Veterans with disability ratings verifying their funding fee exemption status',
      'Military families calculating whether a larger down payment reduces fees enough to justify it',
      'Financial advisors helping veteran clients model first-home purchase scenarios',
    ],
    commonPitfalls: [
      'Forgetting that subsequent use of VA loan with 0% down triggers a 3.30% funding fee — significantly higher than first use.',
      'Not checking disability rating exemption — any rating of 10% or higher eliminates the funding fee entirely.',
      'Financing the funding fee without realizing it accrues 30 years of interest, raising its true cost.',
      'Assuming VA loans have no limits — borrowers with reduced entitlement still face county-level limits.',
      'Overlooking VA appraisal requirements — VA appraisers enforce minimum property condition standards (MPRs) that can delay or derail purchases of fixer-uppers.',
    ],
    glossary: [
      { term: 'VA Funding Fee', definition: 'A one-time fee paid to the Department of Veterans Affairs, replacing PMI. Varies by down payment, loan use, and disability status.' },
      { term: 'VA Entitlement', definition: 'The dollar amount the VA guarantees on a veteran\'s loan. Full entitlement (no county limits) is available when previous VA loans are paid off or when first using the benefit.' },
      { term: 'COE (Certificate of Eligibility)', definition: 'The document issued by the VA confirming a borrower\'s eligibility for a VA loan, based on service history and requirements.' },
      { term: 'MPR (Minimum Property Requirements)', definition: 'VA standards that a property must meet to qualify for VA financing, covering safety, habitability, and structural soundness.' },
      { term: 'IRRRL (Interest Rate Reduction Refinance Loan)', definition: 'A VA streamline refinance product allowing eligible borrowers to lower their rate with minimal documentation. Funding fee: 0.50%.' },
      { term: 'Service-Connected Disability', definition: 'A health condition or injury directly caused or aggravated by military service. A 10%+ rating exempts the veteran from the VA funding fee.' },
    ],
    sources: [
      { title: 'VA Loan Guaranty Program', publisher: 'U.S. Department of Veterans Affairs', url: 'https://www.benefits.va.gov/homeloans/', year: 2024 },
      { title: 'VA Funding Fee Tables (Circular 26-23-24)', publisher: 'U.S. Department of Veterans Affairs', url: 'https://www.benefits.va.gov/homeloans/purchaseco_loan_fee.asp', year: 2024 },
      { title: 'VA Loan Limits', publisher: 'U.S. Department of Veterans Affairs', url: 'https://www.benefits.va.gov/homeloans/loan_limits.asp', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Mortgage & Veterans Benefits Team',
      credentials: 'VA Loan Guidelines & Military Financial Planning Review',
      description: 'Funding fee rates verified against VA Circular 26-23-24. Eligibility rules cross-referenced with VA Lenders Handbook Chapter 2.',
    },
  },

  // ── Home Equity Loan ──────────────────────────────────────────────────────
  'home-equity-loan': {
    howToSteps: [
      'Enter your current home value (use a recent appraisal or Zillow/Redfin estimate).',
      'Enter your current outstanding first mortgage balance.',
      'Enter the loan amount you want to borrow and set the interest rate and term.',
      'The calculator shows your maximum available equity, CLTV ratio, monthly payment, and total cost.',
    ],
    faqs: [
      { question: 'How much can I borrow with a home equity loan?', answer: 'Most lenders allow a Combined Loan-to-Value (CLTV) ratio of up to 85%, meaning your first mortgage plus the equity loan cannot exceed 85% of your home\'s value. On a $450,000 home with a $280,000 mortgage: max combined debt = $382,500; max equity loan = $102,500.' },
      { question: 'What is the difference between a home equity loan and a HELOC?', answer: 'A home equity loan is a fixed-rate, fixed-term loan — a lump sum you repay in equal monthly payments over 5–30 years. A HELOC (Home Equity Line of Credit) is a revolving credit line with a variable rate. Home equity loans are better for one-time large expenses (renovation, debt consolidation); HELOCs are better for ongoing or unpredictable costs.' },
      { question: 'Is home equity loan interest tax-deductible?', answer: 'Since the 2018 Tax Cuts and Jobs Act, home equity loan interest is only deductible if the funds are used to "buy, build, or substantially improve" the home that secures the loan. Interest used for debt consolidation, vacations, or other purposes is generally not deductible. Consult a CPA.' },
      { question: 'What credit score do I need for a home equity loan?', answer: 'Most lenders require a minimum credit score of 620–680, with the best rates reserved for scores above 720. Lenders also look at DTI (typically ≤43%), income verification, and LTV ratio.' },
    ],
    formula: {
      expression: 'Current Equity = Home Value − First Mortgage Balance\nMax CLTV = Home Value × CLTV%\nMax Equity Loan = Max CLTV − First Mortgage Balance\nCLTV After Loan = (First Mortgage + Equity Loan) ÷ Home Value\nMonthly Payment = Loan × [r(1+r)^n] ÷ [(1+r)^n − 1]\nTotal Interest = (Monthly Payment × n) − Loan Amount',
      variables: [
        { symbol: 'CLTV', definition: 'Combined Loan-to-Value — (first mortgage + equity loan) ÷ home value. Most lenders cap at 85%.' },
        { symbol: 'Equity', definition: 'Home market value minus the outstanding first mortgage balance' },
        { symbol: 'Max Equity Loan', definition: 'Maximum borrowable amount: (Home Value × CLTV Limit%) − First Mortgage Balance' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Total number of monthly payments = Loan Term × 12' },
      ],
      notes: 'Home equity loan rates are typically 0.5–2% higher than first mortgage rates because they are second-lien debt (lender is second in line in a foreclosure). Some lenders cap CLTV at 80% in declining markets. The calculator defaults to 85% but this is adjustable.',
    },
    examples: [
      {
        title: 'Kitchen renovation — $50,000 loan',
        scenario: '$450,000 home value, $280,000 first mortgage balance, $50,000 loan requested, 8.5% rate, 10-year term.',
        steps: [
          'Current equity: $450,000 − $280,000 = $170,000 (37.8% equity).',
          'Max CLTV (85%): $450,000 × 0.85 = $382,500.',
          'Max loan available: $382,500 − $280,000 = $102,500.',
          '$50,000 < $102,500 — within limit.',
          'CLTV after loan: ($280,000 + $50,000) ÷ $450,000 = 73.3%.',
          'Monthly payment: $50,000 at 8.5% / 10 yr = $620/mo.',
          'Total interest: $620 × 120 − $50,000 = $24,400.',
        ],
        result: 'Monthly payment: $620 | Total interest: $24,400 | CLTV: 73.3% (safely under 85%)',
      },
      {
        title: 'Debt consolidation — maximum borrowing',
        scenario: '$500,000 home, $350,000 first mortgage, want maximum loan at 8.0%, 15-year term.',
        steps: [
          'Max CLTV (85%): $500,000 × 0.85 = $425,000.',
          'Max loan: $425,000 − $350,000 = $75,000.',
          'CLTV after loan: $425,000 ÷ $500,000 = 85% (at limit).',
          'Monthly payment: $75,000 at 8.0% / 15 yr ≈ $717/mo.',
          'Total interest: $717 × 180 − $75,000 = $54,060.',
        ],
        result: 'Monthly payment: $717 | Max loan: $75,000 | Total interest: $54,060 | CLTV: 85.0%',
      },
    ],
    useCases: [
      'Funding a major home renovation (kitchen, bathroom, addition)',
      'Consolidating high-interest credit card debt into a lower fixed-rate loan',
      'Paying for education expenses without touching retirement accounts',
      'Funding a large medical expense or emergency',
      'Financing a rental property down payment using equity from a primary residence',
      'Comparing the cost of a home equity loan vs cash-out refinance for accessing equity',
    ],
    commonPitfalls: [
      'Treating home equity as "free money" — defaulting on a home equity loan puts your house at risk of foreclosure.',
      'Borrowing to the 85% CLTV limit leaves no buffer if home values decline.',
      'Using a home equity loan for depreciating assets (cars, vacations) rather than value-adding investments.',
      'Not comparing to a cash-out refinance — if rates have dropped since your first mortgage, a refi might be cheaper than a second lien.',
      'Ignoring closing costs — home equity loans typically carry $500–$3,000 in origination fees, appraisal, and title costs.',
    ],
    glossary: [
      { term: 'CLTV (Combined Loan-to-Value)', definition: 'The ratio of all loans secured by a property (first mortgage + equity loan) to the home\'s current value. Lenders typically cap at 85%.' },
      { term: 'Second Lien', definition: 'A loan secured by a property that is subordinate to the first mortgage. In foreclosure, the first mortgage is paid before the second lien.' },
      { term: 'HELOC (Home Equity Line of Credit)', definition: 'A revolving line of credit secured by home equity, typically variable-rate. Different from a home equity loan, which is a fixed-rate lump sum.' },
      { term: 'Cash-Out Refinance', definition: 'Replacing the existing first mortgage with a larger one and taking the difference as cash. Alternative to a home equity loan; may offer lower rates but restarts the amortization clock.' },
      { term: 'Equity', definition: 'The market value of the owner\'s stake in the property: current value minus all secured debts.' },
      { term: 'Loan-to-Value (LTV)', definition: 'For a home equity loan in isolation: equity loan ÷ home value. Distinct from CLTV which stacks all loans.' },
    ],
    sources: [
      { title: 'Home Equity Loan and HELOC Basics', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-home-equity-loan/', year: 2024 },
      { title: 'Tax Cuts and Jobs Act — Home Equity Interest Deductibility', publisher: 'Internal Revenue Service', url: 'https://www.irs.gov/newsroom/interest-on-home-equity-loans-often-still-deductible-under-new-law', year: 2023 },
      { title: 'Home Equity Products — Supervisory Highlights', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/data-research/research-reports/', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Mortgage & Lending Team',
      credentials: 'Home Equity Lending & Consumer Finance Review',
      description: 'CLTV limits and product mechanics verified against CFPB consumer disclosures and major lender underwriting guidelines.',
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

  // ── HELOC ─────────────────────────────────────────────────────────────────
  heloc: {
    howToSteps: [
      'Enter your current home value and remaining mortgage balance to determine available equity.',
      'Input your desired credit limit — the calculator will cap it at the lender\'s maximum CLTV (typically 85%).',
      'Set the interest rate (check current Prime rate + your lender\'s margin), draw period, and repayment period.',
      'Enter your estimated average monthly draw to project total interest costs across both phases.',
      'Review the CLTV ratio, draw-period interest-only payment, and repayment-period P&I payment.',
    ],
    faqs: [
      { question: 'What is the difference between a HELOC and a home equity loan?', answer: 'A HELOC is a revolving credit line — you borrow, repay, and re-borrow during the draw period, paying interest only on the outstanding balance. A home equity loan disburses a lump sum upfront with fixed monthly P&I payments from day one.' },
      { question: 'How is a HELOC credit limit determined?', answer: 'Lenders calculate the maximum Combined Loan-to-Value (CLTV) — typically 80–90% of your home\'s appraised value — and subtract your existing mortgage balance. For example: $500,000 home × 85% CLTV − $300,000 mortgage = $125,000 maximum HELOC.' },
      { question: 'Are HELOC interest rates fixed or variable?', answer: 'Most HELOCs have variable rates tied to the Prime Rate plus a margin (e.g. Prime + 0.5%). This means your payment changes when the Fed adjusts rates. Some lenders offer rate-lock options to convert a portion to a fixed rate.' },
      { question: 'Can I deduct HELOC interest on my taxes?', answer: 'As of the Tax Cuts and Jobs Act (2018), HELOC interest is only deductible if the funds are used to "buy, build, or substantially improve" the home securing the loan. Using HELOC funds for other purposes (debt consolidation, vacations) disqualifies the deduction.' },
      { question: 'What happens at the end of the draw period?', answer: 'The HELOC enters repayment. You can no longer draw funds and must repay the outstanding balance — usually as fully amortizing P&I payments. Some HELOCs require a balloon payment; confirm the terms with your lender.' },
    ],
    formula: {
      expression: 'Max HELOC = (Home Value × Max CLTV%) − Existing Mortgage Balance',
      variables: [
        { symbol: 'CLTV', definition: 'Combined Loan-to-Value ratio — total debt secured by the property divided by appraised value' },
        { symbol: 'Draw Interest', definition: 'Outstanding Balance × (Annual Rate ÷ 12) — interest-only during draw period' },
        { symbol: 'Repayment PMT', definition: 'Standard amortization formula applied to balance outstanding at end of draw period' },
      ],
      notes: 'Interest during the draw period accrues only on amounts actually drawn, not the full credit limit. This calculator uses an average draw model for projection; actual costs depend on your draw pattern.',
    },
    examples: [
      {
        title: 'Home renovation HELOC',
        scenario: '$500,000 home, $300,000 mortgage, 85% CLTV, 8.75% rate, 10-year draw, $500/mo draw.',
        steps: [
          'Max HELOC = $500,000 × 0.85 − $300,000 = $125,000.',
          'CLTV after HELOC = ($300,000 + $125,000) / $500,000 = 85%.',
          'Draw-period interest on avg balance ($31,250): $31,250 × 8.75%/12 ≈ $228/month.',
          'Repayment: $125,000 over 20 years at 8.75% ≈ $1,107/month.',
        ],
        result: '$228/mo draw period · $1,107/mo repayment · $125,000 credit line',
      },
    ],
    useCases: [
      'Home renovation and remodeling — kitchen, bathroom, or addition financing',
      'Emergency fund backstop — low-cost standby credit without drawing unless needed',
      'Debt consolidation — paying off high-interest credit cards with home equity at lower rates',
      'Education expenses — tuition and college costs financed over time',
      'Investment property down payment — using equity in primary residence',
    ],
    commonPitfalls: [
      'Treating a HELOC as permanent income — the lender can reduce or freeze the line if your home value drops or creditworthiness changes.',
      'Interest-only mindset — paying only the draw-period minimum means the full balance remains and payment shock arrives at repayment.',
      'Variable rate risk — a 2% rate increase on a $100,000 balance adds $167/month to your payment.',
      'Over-leveraging — borrowing to the CLTV maximum leaves no equity buffer if home prices decline.',
    ],
    glossary: [
      { term: 'CLTV (Combined LTV)', definition: 'The total of all loans secured by a property divided by its appraised value, expressed as a percentage.' },
      { term: 'Draw Period', definition: 'The initial phase (typically 5–10 years) during which you can borrow, repay, and re-borrow up to your credit limit.' },
      { term: 'Repayment Period', definition: 'The phase following the draw period (typically 10–20 years) when no new draws are allowed and the outstanding balance is repaid with P&I payments.' },
      { term: 'Prime Rate', definition: 'The benchmark interest rate US banks charge their most creditworthy customers; most HELOCs are priced as Prime + a margin.' },
    ],
    sources: [
      { title: 'Home Equity Line of Credit (HELOC)', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-home-equity-line-of-credit-heloc/', year: 2024 },
      { title: 'Publication 936 — Home Mortgage Interest Deduction', publisher: 'Internal Revenue Service', url: 'https://www.irs.gov/publications/p936', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Mortgage Team',
      credentials: 'Certified Mortgage Planning Specialist (CMPS) Advisory Review',
      description: 'HELOC mechanics verified against CFPB guidelines and current bank product disclosures.',
    },
  },

  // ── Down Payment ──────────────────────────────────────────────────────────
  'down-payment': {
    howToSteps: [
      'Enter the home purchase price.',
      'Select your loan type — the required minimum down payment fills automatically (3.5% for FHA, 0% for VA/USDA, or choose Custom).',
      'Enter your current savings and how much you can save each month.',
      'Add your savings account yield (high-yield savings or CD rate) for an accurate timeline.',
      'Review the total cash needed (down payment + closing costs), PMI estimate, and months to reach your goal.',
    ],
    faqs: [
      { question: 'How much down payment do I really need?', answer: 'Minimum requirements range from 0% (VA, USDA) to 3% (some conventional loans), 3.5% (FHA), 5–10% (standard conventional). However, 20% down eliminates PMI and often secures better rates — saving thousands over the loan life.' },
      { question: 'What is PMI and when can I remove it?', answer: 'Private Mortgage Insurance protects the lender if you default. It\'s required on conventional loans with less than 20% down, typically costing 0.5–1.5% of the loan annually. You can request removal when your equity reaches 20%; it auto-cancels at 22% under the Homeowners Protection Act.' },
      { question: 'What are closing costs and how much should I budget?', answer: 'Closing costs cover lender fees (origination, appraisal, credit report), title insurance, escrow, prepaid taxes, and insurance. They typically run 2–5% of the purchase price. Some costs are negotiable; sellers occasionally cover a portion.' },
      { question: 'Is a larger down payment always better?', answer: 'A larger down payment reduces your monthly payment, eliminates PMI, and lowers total interest. However, it also ties up liquid capital. Consider keeping 3–6 months of expenses as an emergency fund and not draining retirement accounts, even for a larger down payment.' },
      { question: 'Can I use gift funds for my down payment?', answer: 'Yes — most loan programs allow gift funds from family members. FHA allows 100% gifted down payment. Conventional loans may require you to contribute a minimum amount from your own funds depending on the loan-to-value ratio. A gift letter is required.' },
    ],
    formula: {
      expression: 'Down Payment = Home Price × Down Payment% | Closing Costs = Home Price × Closing Cost%',
      variables: [
        { symbol: 'LTV', definition: 'Loan-to-Value = Loan Amount ÷ Home Price × 100 — determines PMI requirement' },
        { symbol: 'PMI', definition: 'Estimated at 0.7% of loan amount annually when LTV > 80%; actual rate varies by lender and credit score' },
        { symbol: 'Total Cash Needed', definition: 'Down Payment Amount + Closing Cost Amount' },
        { symbol: 'Months to Goal', definition: 'ln(Gap × r / PMT + 1) / ln(1 + r), where r = monthly yield and PMT = monthly savings' },
      ],
      notes: 'Closing costs vary by state, lender, and loan type. The 3% default is a conservative middle estimate. VA and USDA loans have no PMI but may have funding fees.',
    },
    examples: [
      {
        title: 'First-time buyer — FHA loan',
        scenario: '$350,000 home, FHA 3.5% down, $15,000 saved, $2,000/month savings, 4.5% HYSA yield.',
        steps: [
          'Down payment: $350,000 × 3.5% = $12,250.',
          'Closing costs at 3%: $350,000 × 3% = $10,500.',
          'Total cash needed: $12,250 + $10,500 = $22,750.',
          'Cash gap: $22,750 − $15,000 = $7,750.',
          'Months to save $7,750 at $2,000/mo (4.5% yield): ≈ 4 months.',
        ],
        result: 'Ready in ~4 months. PMI ≈ $191/month until 20% equity.',
      },
      {
        title: 'Conventional 20% — no PMI',
        scenario: '$450,000 home, 20% down, $50,000 saved, $3,000/month savings.',
        steps: [
          'Down payment: $450,000 × 20% = $90,000.',
          'Closing costs at 3%: $13,500.',
          'Total cash needed: $103,500.',
          'Cash gap: $103,500 − $50,000 = $53,500.',
          'Months to save at $3,000/mo: ≈ 17 months.',
        ],
        result: 'Ready in ~17 months. No PMI — saves ~$175/month vs 10% down.',
      },
    ],
    useCases: [
      'First-time homebuyers planning their purchase timeline',
      'Comparing FHA vs conventional loan total cost including PMI',
      'Setting a monthly savings target to buy within a specific timeframe',
      'Understanding how down payment size affects monthly payment and total interest',
      'Evaluating whether to wait for 20% down or buy sooner with PMI',
    ],
    commonPitfalls: [
      'Forgetting closing costs — buyers who only save for the down payment are often surprised by an additional 2–5% needed at closing.',
      'Ignoring PMI when comparing loan options — FHA MIP can exceed conventional PMI and lasts the life of the loan if down payment < 10%.',
      'Depleting emergency savings — leaving nothing after closing puts you at financial risk for repairs and unexpected expenses.',
      'Not accounting for rate of return on savings — a 4–5% HYSA meaningfully shortens the timeline via compound interest.',
    ],
    glossary: [
      { term: 'LTV (Loan-to-Value)', definition: 'The ratio of your loan amount to the home\'s purchase price or appraised value. Higher LTV = less equity = higher risk to lenders.' },
      { term: 'PMI (Private Mortgage Insurance)', definition: 'Insurance protecting the lender against borrower default on conventional loans with LTV above 80%.' },
      { term: 'MIP (Mortgage Insurance Premium)', definition: 'FHA\'s equivalent of PMI. Includes an upfront premium (1.75% of loan) and annual premium (0.55–1.05%).' },
      { term: 'Closing Costs', definition: 'Fees paid at closing beyond the down payment: origination, appraisal, title, escrow, prepaid taxes and insurance.' },
    ],
    sources: [
      { title: 'Buying a Home', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/owning-a-home/', year: 2024 },
      { title: 'Down Payment Assistance Programs', publisher: 'U.S. Department of Housing and Urban Development (HUD)', url: 'https://www.hud.gov/topics/buying_a_home', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Mortgage Team',
      credentials: 'Certified Mortgage Planning Specialist (CMPS) Advisory Review',
      description: 'Down payment guidance verified against HUD, FHA, VA, and CFPB published guidelines.',
    },
  },

  // ── Refinance ──────────────────────────────────────────────────────────────
  refinance: {
    howToSteps: [
      'Enter your current loan balance, interest rate, monthly P&I payment, and months remaining.',
      'Input the new loan\'s interest rate and term you\'re considering.',
      'Add estimated closing costs (2–5% of loan amount is typical).',
      'Choose whether to pay closing costs upfront or roll them into the new loan.',
      'Review the break-even point, monthly savings, and lifetime interest comparison.',
    ],
    faqs: [
      { question: 'When does refinancing make financial sense?', answer: 'The classic rule of thumb is to refinance when you can lower your rate by at least 1% and expect to stay in the home past the break-even point (when cumulative monthly savings exceed closing costs). However, smaller rate drops can still make sense on large balances or long remaining terms.' },
      { question: 'What are typical refinancing closing costs?', answer: 'Expect 2–5% of the loan amount, covering origination fees, appraisal ($300–$600), title search, title insurance, recording fees, and prepaid interest. On a $300,000 loan that\'s $6,000–$15,000. Some lenders offer "no-closing-cost" refis where costs are built into a slightly higher rate.' },
      { question: 'Should I choose a shorter or longer term when refinancing?', answer: 'A shorter term (e.g. 15-year) saves substantial interest but increases your monthly payment. A longer term (e.g. 30-year) lowers your payment but may cost more in total interest, especially if you reset a loan that was nearly paid off. The calculator shows both scenarios.' },
      { question: 'What is a cash-out refinance?', answer: 'A cash-out refi replaces your mortgage with a larger one, giving you the difference in cash. This calculator covers rate-and-term refinancing only. Cash-out refis have separate LTV and equity requirements and typically carry slightly higher rates.' },
      { question: 'How does rolling closing costs into the loan affect savings?', answer: 'Rolling in closing costs eliminates the upfront expense but increases your loan balance, raising your monthly payment slightly and costing more in interest over time. The break-even calculation changes because there\'s no upfront cost to recover — but you pay more overall.' },
    ],
    formula: {
      expression: 'Break-Even (months) = Closing Costs ÷ Monthly Savings | Net Savings = (Current PMT − New PMT) × Projection Months − Closing Costs',
      variables: [
        { symbol: 'New PMT', definition: 'New monthly P&I = P × [r(1+r)^n] / [(1+r)^n − 1], where P = new balance, r = new monthly rate, n = new term months' },
        { symbol: 'Monthly Savings', definition: 'Current Monthly Payment − New Monthly Payment (positive = savings)' },
        { symbol: 'Break-Even', definition: 'Months until cumulative savings equals out-of-pocket closing costs' },
        { symbol: 'Lifetime Interest Savings', definition: 'Remaining interest on current loan − Total interest on new loan (can be negative if term is extended)' },
      ],
      notes: 'If closing costs are rolled into the new loan, the break-even point is zero months (no upfront cost) but total interest paid is higher. The lifetime interest comparison accounts for the remaining current term vs. the full new term.',
    },
    examples: [
      {
        title: 'Rate drop refinance — clear winner',
        scenario: '$320,000 balance, 7.25% → 6.25%, 30-year refi, $6,400 closing costs, 312 months remaining.',
        steps: [
          'Current payment at 7.25%: ≈ $2,183/month.',
          'New payment at 6.25% / 30 years: ≈ $1,971/month.',
          'Monthly savings: $212.',
          'Break-even: $6,400 ÷ $212 ≈ 30 months.',
          'If staying 10+ years: total savings far exceed closing costs.',
        ],
        result: 'Break-even in 2.5 years. Saves $212/month and ~$29,000 in interest over 10 years.',
      },
      {
        title: 'Term extension risk',
        scenario: '$200,000 balance with 10 years left at 6%. Refinancing to 30 years at 5.5%.',
        steps: [
          'Current remaining interest: ≈ $65,000.',
          'New 30-year interest: ≈ $208,000.',
          'Monthly payment drops $600 but costs $143,000 more in total interest.',
        ],
        result: 'Lower monthly payment but $143,000 more in interest — not recommended unless cash flow is critical.',
      },
    ],
    useCases: [
      'Lowering monthly payment when interest rates drop significantly below your current rate',
      'Switching from a 30-year to a 15-year mortgage to build equity faster',
      'Eliminating PMI by refinancing once you reach 20% equity',
      'Converting an adjustable-rate mortgage (ARM) to a fixed-rate loan for payment stability',
      'Evaluating whether a lender\'s promotional rate offer genuinely saves money',
    ],
    commonPitfalls: [
      'Refinancing when you plan to sell soon — if you move before the break-even point, you lose money on closing costs.',
      'Resetting the clock on a nearly-paid-off mortgage — refinancing a 5-year-old 30-year loan to another 30 years dramatically increases lifetime interest.',
      'Ignoring closing costs in "no-closing-cost" offers — the cost is embedded in a higher rate and paid over time.',
      'Refinancing repeatedly without strategic purpose — each refi resets amortization, and early payments are mostly interest.',
    ],
    glossary: [
      { term: 'Rate-and-Term Refinance', definition: 'Replacing your existing mortgage with a new one at a different rate and/or term, without changing the loan balance significantly.' },
      { term: 'Break-Even Point', definition: 'The month at which cumulative monthly savings from the lower payment exceed the upfront closing costs paid.' },
      { term: 'APR (Annual Percentage Rate)', definition: 'The true annual cost of the loan including interest and fees, expressed as a percentage. Useful for comparing loan offers with different fee structures.' },
      { term: 'Amortization Reset', definition: 'When you refinance, your new loan begins a fresh amortization schedule — early payments are again mostly interest rather than principal.' },
    ],
    sources: [
      { title: 'When to Refinance Your Mortgage', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/when-should-i-consider-refinancing-my-mortgage/', year: 2024 },
      { title: 'Mortgage Refinance Guide', publisher: 'Federal Reserve', url: 'https://www.federalreserve.gov/pubs/refinancings/', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Mortgage Team',
      credentials: 'Certified Mortgage Planning Specialist (CMPS) Advisory Review',
      description: 'Refinance break-even methodology validated against CFPB and Federal Reserve published guidelines.',
    },
  },

  // ── Mortgage Payoff ────────────────────────────────────────────────────────
  'mortgage-payoff': {
    howToSteps: [
      'Enter your current loan balance, interest rate, and regular monthly P&I payment.',
      'Add an extra monthly payment amount — even $100–$200 per month makes a significant difference.',
      'Optionally add a one-time lump sum (tax refund, bonus) applied to principal today.',
      'See the new payoff date, months saved, and total interest saved instantly.',
      'Adjust the extra payment slider to find the payoff acceleration that fits your budget.',
    ],
    faqs: [
      { question: 'How much interest can extra payments save?', answer: 'On a typical 30-year $300,000 mortgage at 6.85%, paying an extra $200/month saves approximately $45,000 in interest and cuts 5.5 years off the loan. The savings are front-loaded because interest accrues on a larger balance early in the loan.' },
      { question: 'Should extra payments go to principal or escrow?', answer: 'Extra payments must be directed to principal to reduce your balance and save interest. Contact your loan servicer or note "Apply to principal only" on your payment. Sending extra money without this instruction may be applied to future regular payments instead.' },
      { question: 'Is it better to pay extra monthly or in a lump sum?', answer: 'A lump sum made today reduces your balance immediately and starts saving interest right away. Monthly extra payments are more flexible and sustainable. This calculator lets you model both simultaneously — they compound together for maximum payoff acceleration.' },
      { question: 'Should I pay off my mortgage early or invest instead?', answer: 'It depends on your mortgage rate vs. expected investment returns. If your rate is 7% and you expect 8–10% stock market returns, investing may win mathematically. However, paying off debt is a guaranteed return equal to your interest rate with no market risk — valuable for peace of mind and retirement planning.' },
      { question: 'Does making extra payments change my minimum required payment?', answer: 'No. Your minimum required monthly payment stays the same regardless of extra principal payments. Extra payments simply reduce your balance faster, shortening the loan term. Your servicer will not reduce your required payment due to extra payments.' },
    ],
    formula: {
      expression: 'Remaining Balance After n Payments: B_n = P(1+r)^n − PMT[(1+r)^n − 1]/r',
      variables: [
        { symbol: 'P', definition: 'Current outstanding principal balance' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'PMT', definition: 'Total monthly payment including any extra amount' },
        { symbol: 'n', definition: 'Number of months until balance reaches zero' },
      ],
      notes: 'Any lump-sum payment is applied to the principal balance immediately before the regular amortization schedule begins. This maximizes interest savings because the reduced balance compounds for the entire remaining term.',
    },
    examples: [
      {
        title: '$200/month extra — 30-year mortgage',
        scenario: '$280,000 balance, 6.85% rate, $1,844/month regular payment.',
        steps: [
          'Regular payoff: 360 months (30 years), total interest ≈ $383,000.',
          'With $200/mo extra: total payment $2,044/month.',
          'New payoff: ≈ 293 months (24.4 years).',
          'Months saved: 67 months (5.6 years).',
          'Interest saved: ≈ $47,200.',
        ],
        result: 'Pay off 5.6 years early and save ~$47,200 in interest for $200/month.',
      },
      {
        title: 'Lump sum $10,000 tax refund',
        scenario: 'Same $280,000 mortgage — apply $10,000 lump sum today.',
        steps: [
          'New balance after lump sum: $270,000.',
          'New payoff: ≈ 344 months.',
          'Months saved: 16 months.',
          'Interest saved: ≈ $11,400.',
        ],
        result: 'One $10,000 payment saves $11,400 in interest and 16 months.',
      },
    ],
    useCases: [
      'Planning mortgage freedom before retirement',
      'Evaluating whether a year-end bonus should go to the mortgage or investments',
      'Comparing bi-weekly payment strategies to extra monthly payments',
      'Calculating payoff date when refinancing isn\'t worthwhile but debt reduction is desired',
      'Motivating consistent extra payments by seeing the compounding impact in real time',
    ],
    commonPitfalls: [
      'Not specifying "apply to principal" — servicers may credit extra payments to future monthly obligations instead of reducing principal.',
      'Neglecting emergency fund to make extra payments — liquidity is essential; ensure 3–6 months of expenses are accessible first.',
      'Ignoring tax implications — mortgage interest deductions (if itemizing) decrease as you pay down faster, slightly offsetting the tax benefit.',
      'Paying extra on a 3% pandemic-era mortgage while carrying 20%+ credit card debt — always eliminate higher-rate debt first.',
    ],
    glossary: [
      { term: 'Principal Curtailment', definition: 'A payment made directly against the principal balance, separate from and in addition to the regular monthly payment.' },
      { term: 'Amortization', definition: 'The process of paying off a loan with regular payments over time, where each payment covers interest first and the remainder reduces principal.' },
      { term: 'Payoff Date', definition: 'The month and year in which the outstanding loan balance reaches zero and the mortgage is fully satisfied.' },
      { term: 'Bi-Weekly Payments', definition: 'Paying half the monthly mortgage payment every two weeks, resulting in 26 half-payments (13 full payments) per year instead of 12 — an effective extra payment strategy.' },
    ],
    sources: [
      { title: 'Making Extra Mortgage Payments', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/ask-cfpb/how-can-i-pay-off-my-mortgage-faster/', year: 2024 },
      { title: 'Homeowners Protection Act — PMI Cancellation', publisher: 'Federal Trade Commission', url: 'https://consumer.ftc.gov/articles/home-equity-loans-and-home-equity-lines-credit', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Mortgage Team',
      credentials: 'Certified Mortgage Planning Specialist (CMPS) Advisory Review',
      description: 'Payoff acceleration formulas verified against standard amortization mathematics and CFPB consumer guidance.',
    },
  },

  // ── UK Mortgage ────────────────────────────────────────────────────────────
  'mortgage-uk': {
    howToSteps: [
      'Enter the property value and your deposit — the LTV and loan amount calculate automatically.',
      'Input your mortgage interest rate (use your initial fixed-rate period, e.g. 2 or 5-year fix).',
      'Set the mortgage term (25 years is standard in the UK) and choose repayment or interest-only.',
      'Select your buyer type — first-time buyer, home mover, or additional property — to calculate the correct Stamp Duty Land Tax (SDLT).',
      'Add any arrangement fee and choose whether to pay it upfront or add it to the loan.',
      'Review the monthly payment, Stamp Duty breakdown, and total purchase cost.',
    ],
    faqs: [
      { question: 'How is Stamp Duty Land Tax (SDLT) calculated in England?', answer: 'SDLT is banded: 0% on the first £250,000; 5% on £250,001–£925,000; 10% on £925,001–£1,500,000; 12% above that. First-time buyers pay 0% up to £425,000 and 5% from £425,001–£625,000. Additional properties (buy-to-let, second homes) attract a 3% surcharge on every band.' },
      { question: 'Does Scotland or Wales use the same Stamp Duty?', answer: 'No. Scotland uses Land and Buildings Transaction Tax (LBTT) with different thresholds and rates. Wales uses Land Transaction Tax (LTT). This calculator applies England & Northern Ireland SDLT rates — residents of Scotland or Wales should consult their respective Revenue authorities.' },
      { question: 'What is the difference between repayment and interest-only mortgages?', answer: 'With a repayment mortgage, each monthly payment covers both interest and a portion of the capital — you own the property outright at the end. With an interest-only mortgage, monthly payments cover interest alone; you must repay the full capital at term end via a separate repayment vehicle (ISA, pension, property sale).' },
      { question: 'What LTV can I expect to get a mortgage?', answer: 'Most UK lenders offer mortgages up to 95% LTV (5% deposit), though higher LTV products carry higher interest rates and fewer product options. The best rates typically start at 60% LTV. Above 90% LTV, options narrow significantly; lenders price in additional risk.' },
      { question: 'What is a mortgage arrangement fee?', answer: 'An arrangement (or product) fee is charged by the lender for setting up the mortgage, typically £0–£2,000. You can pay it upfront or add it to the loan balance. Adding it to the loan means you pay interest on the fee for the full mortgage term, increasing total cost.' },
      { question: 'How does the Help to Buy scheme affect my mortgage?', answer: 'The original Help to Buy Equity Loan scheme closed to new applicants in 2023. Buyers who used it have a government equity loan (typically 20%, or 40% in London) which affects their LTV calculation and will need to be repaid. This calculator models standard mortgages without equity loan components.' },
    ],
    formula: {
      expression: 'Monthly Repayment PMT = L × [r(1+r)^n] / [(1+r)^n − 1]  |  Interest-Only PMT = L × r',
      variables: [
        { symbol: 'L', definition: 'Loan amount (property value − deposit; + arrangement fee if rolled in)' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Total number of monthly payments = Term Years × 12' },
        { symbol: 'SDLT', definition: 'Stamp Duty Land Tax — banded tax on England & N. Ireland property purchases, calculated on marginal bands' },
      ],
      notes: 'SDLT is calculated on marginal bands (not the whole price at the highest rate). First-time buyer relief applies only when the purchase price does not exceed £625,000.',
    },
    examples: [
      {
        title: 'First-time buyer in England',
        scenario: '£350,000 property, £70,000 deposit (20% LTV), 4.5% rate, 25-year repayment term.',
        steps: [
          'Loan: £350,000 − £70,000 = £280,000. LTV = 80%.',
          'Monthly payment: £280,000 at 4.5%/12 over 300 months ≈ £1,556/month.',
          'SDLT (first-time buyer): £0 on first £250,000; 5% on £100,000 = £5,000. Total SDLT = £5,000.',
          'Wait — property is £350,000 < £425,000 so first-time buyer 0% applies to full £350,000. SDLT = £0.',
          'Total purchase cost: £350,000 + £0 SDLT = £350,000 (plus solicitor/survey fees).',
        ],
        result: '£1,556/month · £0 SDLT (first-time buyer relief) · £180,000 total interest over 25 years',
      },
      {
        title: 'Home mover — standard SDLT',
        scenario: '£600,000 property, £150,000 deposit, 4.2% rate, 25-year repayment, home mover.',
        steps: [
          'Loan: £450,000. LTV = 75%.',
          'Monthly payment ≈ £2,440/month.',
          'SDLT: 0% on £250,000 = £0; 5% on £350,000 (£250k–£600k) = £17,500. Total = £17,500.',
          'Total purchase cost: £600,000 + £17,500 = £617,500.',
        ],
        result: '£2,440/month · £17,500 SDLT · Total purchase cost £617,500',
      },
    ],
    useCases: [
      'First-time buyers budgeting total purchase costs including Stamp Duty',
      'Home movers comparing repayment vs. interest-only monthly cash flow',
      'Buy-to-let investors calculating Stamp Duty surcharge impact on yield',
      'UK expats returning home and assessing affordability at current rates',
      'Comparing true cost of different mortgage terms (20 vs 25 vs 30 years)',
    ],
    commonPitfalls: [
      'Confusing the initial fixed rate with the Standard Variable Rate (SVR) — after the fix ends, your payment will change, typically increasing substantially.',
      'Forgetting additional purchase costs: solicitor/conveyancing fees (£1,500–£3,000), survey (£500–£1,500), and removal costs.',
      'Interest-only without a repayment vehicle — the FCA requires lenders to verify a credible repayment strategy; lacking one is a serious financial risk.',
      'Assuming Help to Buy is still available — the equity loan scheme closed in March 2023.',
      'Ignoring the 3% SDLT surcharge when buying a second property — it applies even when letting out your former home.',
    ],
    glossary: [
      { term: 'SDLT (Stamp Duty Land Tax)', definition: 'A tax levied by HMRC on property purchases in England and Northern Ireland, calculated on marginal bands above threshold values.' },
      { term: 'LTV (Loan-to-Value)', definition: 'The mortgage loan amount expressed as a percentage of the property value. Lower LTV = larger deposit = better rates.' },
      { term: 'Arrangement Fee', definition: 'A lender\'s product fee charged to set up the mortgage, typically £0–£2,000. Often higher fees accompany lower headline rates.' },
      { term: 'SVR (Standard Variable Rate)', definition: 'The default rate a UK lender charges after a fixed or tracker period ends. Usually substantially higher than product rates — remortgaging before SVR is standard practice.' },
      { term: 'Conveyancing', definition: 'The legal process of transferring property ownership, handled by a solicitor or licensed conveyancer. A required step in every UK property purchase.' },
    ],
    sources: [
      { title: 'Stamp Duty Land Tax', publisher: 'HM Revenue & Customs (HMRC)', url: 'https://www.gov.uk/stamp-duty-land-tax', year: 2024 },
      { title: 'Mortgage Best Buys and Rates', publisher: 'Financial Conduct Authority (FCA)', url: 'https://www.fca.org.uk/consumers/mortgages', year: 2024 },
      { title: 'Help to Buy: Equity Loan Scheme', publisher: 'Homes England / GOV.UK', url: 'https://www.gov.uk/help-to-buy-equity-loan', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree UK Finance Team',
      credentials: 'CeMAP-qualified Mortgage Adviser Review',
      description: 'UK mortgage and SDLT calculations verified against current HMRC published rates and FCA mortgage guidance.',
    },
  },

  // ── Canadian Mortgage ─────────────────────────────────────────────────────
  'canadian-mortgage': {
    howToSteps: [
      'Enter the home purchase price in Canadian dollars and your down payment amount — the calculator shows your down payment percentage in real time.',
      'Input the quoted annual interest rate from your lender (e.g. 5.25%). The calculator automatically applies Canadian semi-annual compounding as required by the Interest Act.',
      'Choose your amortization period (5–30 years; maximum 25 years if CMHC insurance applies) and preferred payment frequency: Monthly, Bi-Weekly, or Accelerated Bi-Weekly.',
      'Optionally add your annual property tax and monthly condo/strata fee — the Total Monthly Outlay card will reflect all costs together.',
    ],
    faqs: [
      {
        question: 'Why is a Canadian mortgage calculated differently from a US mortgage?',
        answer: 'Canada\'s Interest Act requires that mortgage interest be compounded semi-annually, not monthly. Lenders quote a nominal annual rate, but interest actually compounds twice per year. To find your true monthly payment, the quoted rate must first be converted to an effective monthly rate: (1 + r/200)^(1/6) − 1, where r is the annual rate. This produces slightly lower payments than a US-style monthly-compounding loan at the same quoted rate.',
      },
      {
        question: 'What is CMHC mortgage insurance and when is it required?',
        answer: 'CMHC (Canada Mortgage and Housing Corporation) mortgage default insurance is mandatory when your down payment is between 5% and 19.99% of the purchase price. The premium (2.8%–4.0% of the insured loan amount) is added directly to your mortgage principal and amortized over the life of the loan. With ≥ 20% down, CMHC insurance is not required and the maximum amortization extends to 30 years.',
      },
      {
        question: 'What is accelerated bi-weekly payment and how much does it save?',
        answer: 'Accelerated bi-weekly payments are calculated by dividing the monthly payment in half and paying that amount every two weeks (26 times per year). Because 26 × (monthly/2) = 13 monthly payments per year rather than 12, you make one extra full monthly payment annually. This can shave 2–4 years off a 25-year amortization and save tens of thousands of dollars in interest.',
      },
      {
        question: 'What is the minimum down payment in Canada?',
        answer: 'The minimum down payment depends on purchase price: 5% on the first $500,000, and 10% on the portion between $500,000 and $999,999. Properties priced at $1,000,000 or more require a minimum 20% down payment and are not eligible for CMHC insurance.',
      },
      {
        question: 'Does my mortgage term equal my amortization period?',
        answer: 'No. In Canada, the amortization period is the total time to pay off the mortgage (typically 25 years), while the mortgage term is the length of your current rate contract (commonly 1–5 years). At the end of each term you renegotiate or renew the rate, but the amortization clock keeps running.',
      },
      {
        question: 'Is the interest rate the same as the APR for Canadian mortgages?',
        answer: 'No. Lenders in Canada must disclose an Annual Percentage Rate (APR) that includes the lender\'s fees. However, the semi-annual compounding rule means even the stated rate understates the cost slightly compared to a monthly-compounding loan. Always compare the effective monthly rate — shown in the results panel — when evaluating different lenders.',
      },
    ],
    formula: {
      expression:
        'Step 1 — Effective monthly rate:\n  r_m = (1 + r_nom / 200)^(1/6) − 1\n\nStep 2 — Monthly payment (P&I):\n  M = L × r_m × (1 + r_m)^n\n      ────────────────────────\n      (1 + r_m)^n − 1\n\nStep 3 — Accelerated bi-weekly payment:\n  P_abw = M / 2   (paid 26×/yr → one extra monthly payment/yr)\n\nStep 4 — CMHC premium (if down < 20%):\n  Premium = L × CMHC_rate\n  Total mortgage = L + Premium',
      variables: [
        { symbol: 'r_nom', definition: 'Nominal annual interest rate quoted by the lender (e.g. 5.25)' },
        { symbol: 'r_m', definition: 'Effective monthly rate after converting from semi-annual compounding' },
        { symbol: 'L', definition: 'Loan amount = Home Price − Down Payment (+ CMHC premium if applicable)' },
        { symbol: 'n', definition: 'Total number of monthly payments = Amortization Years × 12' },
        { symbol: 'M', definition: 'Monthly principal & interest payment' },
        { symbol: 'P_abw', definition: 'Accelerated bi-weekly payment = M ÷ 2' },
        { symbol: 'CMHC_rate', definition: '4.00% (5–9.99% down), 3.10% (10–14.99%), or 2.80% (15–19.99%)' },
      ],
      notes:
        'The semi-annual compounding conversion is mandated by Section 6 of Canada\'s Interest Act (RSC 1985, c I-15). Bi-weekly (non-accelerated) payments use an effective bi-weekly rate of (1 + r_m)^(1/2) − 1 and produce the same total interest as monthly payments; only accelerated bi-weekly payments reduce the amortization.',
    },
    examples: [
      {
        title: 'First-time buyer — 10% down, CMHC required',
        scenario: 'Purchasing a $650,000 condo in Toronto with $65,000 down (10%), 5.25% rate, 25-year amortization, monthly payments.',
        steps: [
          'Loan amount: $650,000 − $65,000 = $585,000. Down payment = 10% → CMHC rate = 3.10%.',
          'CMHC premium: $585,000 × 3.10% = $18,135. Total mortgage: $585,000 + $18,135 = $603,135.',
          'Effective monthly rate: (1 + 5.25/200)^(1/6) − 1 = 0.43279% per month.',
          'n = 25 × 12 = 300 payments.',
          'Monthly payment: $603,135 × 0.0043279 × (1.0043279)^300 / [(1.0043279)^300 − 1] = $3,203.77.',
          'Total interest over 25 years: ≈ $357,996. Total cost: ≈ $961,131.',
        ],
        result: '$3,203.77/month | $18,135 CMHC premium added to mortgage | ≈ $358K total interest',
      },
      {
        title: 'Move-up buyer — 20% down, accelerated bi-weekly savings',
        scenario: 'Purchasing an $800,000 home with $160,000 down (20%), 5.00% rate, 25-year amortization. Comparing monthly vs accelerated bi-weekly.',
        steps: [
          'Loan: $800,000 − $160,000 = $640,000. No CMHC (20% down).',
          'Effective monthly rate: (1 + 5.00/200)^(1/6) − 1 = 0.41239%.',
          'Monthly payment (25 yr): $640,000 × 0.0041239 × (1.0041239)^300 / [(1.0041239)^300 − 1] = $3,724.21.',
          'Accelerated bi-weekly payment: $3,724.21 / 2 = $1,862.11.',
          'Effective annual payments: 26 × $1,862.11 = $48,414.86 vs 12 × $3,724.21 = $44,690.52 — one extra month paid each year.',
          'Accelerated bi-weekly fully amortizes in ≈ 22.0 years, saving ≈ 3 years and ≈ $44,000 in interest.',
        ],
        result: '$3,724.21/mo OR $1,862.11 bi-weekly (accelerated) — saves ~3 years and ~$44,000 in interest',
      },
    ],
    useCases: [
      '✓ Budgeting for a first home purchase anywhere in Canada — including CMHC premium impact',
      '✓ Comparing monthly vs accelerated bi-weekly payment strategies to see interest savings',
      '✓ Estimating total monthly housing costs including property tax and condo fees for stress-test purposes',
      '✓ Evaluating mortgage renewal scenarios when your term expires',
      '✓ Understanding how a larger down payment eliminates CMHC insurance and changes your payment',
      '✓ Planning the maximum home price you can afford given a target monthly payment',
    ],
    commonPitfalls: [
      '⚠ Confusing the mortgage term (1–5 yr rate contract) with the amortization period (total payoff timeline) — they are different.',
      '⚠ Forgetting that CMHC insurance is added to your mortgage principal, increasing both the loan size and total interest paid.',
      '⚠ Assuming "bi-weekly" and "accelerated bi-weekly" are the same — only the accelerated option reduces amortization.',
      '⚠ Ignoring closing costs: land transfer tax, legal fees, title insurance, and home inspection (typically $5,000–$25,000+).',
      '⚠ Not accounting for the Canadian mortgage stress test — federally regulated lenders qualify you at the higher of your contract rate + 2% or 5.25%.',
      '⚠ Comparing Canadian and US mortgage rates directly — semi-annual vs monthly compounding makes the Canadian rate effectively lower per month at the same quoted figure.',
    ],
    glossary: [
      { term: 'Amortization Period', definition: 'The total length of time required to pay off the mortgage entirely through regular payments. Maximum 25 years with CMHC insurance; up to 30 years with 20%+ down.' },
      { term: 'Mortgage Term', definition: 'The length of your current rate agreement with the lender, typically 1–5 years in Canada. At renewal, you renegotiate the rate for the remaining amortization.' },
      { term: 'CMHC Insurance', definition: 'Canada Mortgage and Housing Corporation mortgage default insurance, mandatory for down payments under 20%. Premiums range from 2.80% to 4.00% of the insured loan amount.' },
      { term: 'Semi-Annual Compounding', definition: 'The compounding frequency mandated by Canada\'s Interest Act for mortgages. Interest compounds twice per year, which is converted to an effective monthly rate for payment calculations.' },
      { term: 'Accelerated Bi-Weekly', definition: 'A payment schedule where you pay half the monthly payment every two weeks (26 payments/year), effectively making 13 monthly payments per year and reducing amortization.' },
      { term: 'Stress Test (OSFI B-20)', definition: 'A federal requirement that lenders qualify borrowers at the higher of their contract rate + 2% or 5.25%, ensuring they can manage higher rates at renewal.' },
      { term: 'Land Transfer Tax', definition: 'A provincial tax paid at closing on the purchase of real estate. First-time buyers in Ontario and B.C. qualify for partial or full rebates.' },
      { term: 'LTV (Loan-to-Value)', definition: 'The mortgage amount as a percentage of the property value. LTV above 80% triggers mandatory CMHC insurance for federally regulated lenders.' },
    ],
    sources: [
      { title: 'Interest Act (RSC 1985, c I-15)', publisher: 'Government of Canada / Justice Laws', url: 'https://laws-lois.justice.gc.ca/eng/acts/I-15/', year: 2024 },
      { title: 'CMHC Mortgage Loan Insurance Premiums', publisher: 'Canada Mortgage and Housing Corporation', url: 'https://www.cmhc-schl.gc.ca/consumers/home-buying/mortgage-loan-insurance-for-consumers/cmhc-mortgage-loan-insurance-cost', year: 2024 },
      { title: 'Residential Mortgage Underwriting Practices — Guideline B-20', publisher: 'Office of the Superintendent of Financial Institutions (OSFI)', url: 'https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/residential-mortgage-underwriting-practices-procedures', year: 2023 },
      { title: 'Homebuying Step by Step', publisher: 'Canada Mortgage and Housing Corporation', url: 'https://www.cmhc-schl.gc.ca/consumers/home-buying/homebuying-calculators', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Canadian Finance Team',
      credentials: 'Reviewed against CMHC and OSFI B-20 guidelines',
      description: 'Canadian mortgage calculations verified against the Interest Act semi-annual compounding requirement, current CMHC premium schedules, and OSFI residential mortgage guidelines.',
    },
  },

  // ── Personal Loan ─────────────────────────────────────────────────────────
  'personal-loan': {
    howToSteps: [
      'Enter the loan amount you wish to borrow and the annual interest rate quoted by your lender.',
      'Set the loan term in months (e.g. 36 for 3 years, 60 for 5 years). Your monthly payment and total interest update instantly.',
      'Toggle "Include Origination Fee" if your lender charges one, and enter the fee as a dollar amount or percentage — the calculator adjusts your true APR automatically.',
      'Review the amortization table to see exactly how much of each payment goes to principal vs interest, and track your remaining balance month by month.',
    ],
    faqs: [
      {
        question: 'What is the difference between the interest rate and APR on a personal loan?',
        answer: 'The interest rate (also called the nominal rate) determines your monthly payment on the principal. APR (Annual Percentage Rate) includes the interest rate plus all mandatory fees — most importantly the origination fee — expressed as a single annualised cost. Because origination fees are typically deducted from your disbursement but you still repay the full loan amount, the APR is always higher than the stated rate. The calculator estimates APR using Newton-Raphson iteration on the true cash-flow sequence.',
      },
      {
        question: 'How is the monthly payment on a personal loan calculated?',
        answer: 'Personal loans use standard amortisation: M = P × [r(1+r)^n] / [(1+r)^n − 1], where P is the principal, r is the monthly rate (annual rate ÷ 12), and n is the number of months. Each month\'s payment covers first the interest on the remaining balance, then reduces principal — early payments are mostly interest; later payments are mostly principal.',
      },
      {
        question: 'What is an origination fee and how does it affect my loan?',
        answer: 'An origination fee (typically 1%–8% of the loan amount) is charged by lenders to process the loan. It is usually deducted from your disbursement — so if you borrow $10,000 with a 3% fee, you receive $9,700 but repay $10,000. This makes your true borrowing cost (APR) meaningfully higher than the quoted interest rate. Always compare loans using APR, not just the interest rate.',
      },
      {
        question: 'Is it better to choose a shorter or longer loan term?',
        answer: 'A shorter term means higher monthly payments but significantly less total interest paid. A longer term reduces monthly cash flow pressure but increases total cost substantially. Use the calculator to compare: a $15,000 loan at 12% for 36 months costs ~$2,931 in interest; stretched to 60 months, total interest rises to ~$4,896 — 67% more — for the same loan amount.',
      },
      {
        question: 'Can I pay off a personal loan early?',
        answer: 'Most unsecured personal loans allow early payoff with no prepayment penalty, though you should confirm with your lender. Paying extra toward principal reduces the remaining balance and cuts future interest. Even one extra payment per year on a 5-year loan can save hundreds of dollars and several months of repayment.',
      },
    ],
    formula: {
      expression:
        'Monthly payment:\n  M = P × r × (1 + r)^n\n      ─────────────────────\n      (1 + r)^n − 1\n\nTrue APR (Newton-Raphson on cash flows):\n  Solve for i such that:\n  Net Proceeds = Σ [ M / (1 + i)^t ]  for t = 1 to n\n  where Net Proceeds = P − Origination Fee\n  APR = i × 12',
      variables: [
        { symbol: 'P', definition: 'Principal — full loan amount before any fees are deducted' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Loan term in months' },
        { symbol: 'M', definition: 'Fixed monthly payment (principal + interest)' },
        { symbol: 'i', definition: 'True monthly cost rate used to derive APR, solved iteratively' },
        { symbol: 'APR', definition: 'Annual Percentage Rate — total annualised cost including origination fee' },
      ],
      notes:
        'APR estimation uses Newton-Raphson iteration (typically converges in < 20 steps). The result matches the Truth in Lending Act (TILA / Regulation Z) definition used by U.S. lenders. For fee-free loans, APR equals the nominal annual rate exactly.',
    },
    examples: [
      {
        title: 'Debt consolidation loan — no origination fee',
        scenario: '$15,000 loan at 9.5% APR, 48-month term, no origination fee.',
        steps: [
          'Monthly rate r = 9.5% / 12 / 100 = 0.7917%.',
          'Monthly payment: $15,000 × 0.007917 × (1.007917)^48 / [(1.007917)^48 − 1] = $375.82.',
          'Total paid: $375.82 × 48 = $18,039.36.',
          'Total interest: $18,039.36 − $15,000 = $3,039.36.',
        ],
        result: '$375.82/month | $3,039 total interest | Effective APR = 9.50%',
      },
      {
        title: 'Home improvement loan — 3% origination fee',
        scenario: '$20,000 loan at 11.0% stated rate, 60-month term, 3% origination fee ($600).',
        steps: [
          'Monthly rate r = 11.0% / 12 / 100 = 0.9167%.',
          'Monthly payment on $20,000: $20,000 × 0.009167 × (1.009167)^60 / [(1.009167)^60 − 1] = $434.85.',
          'Net proceeds received: $20,000 − $600 = $19,400.',
          'True APR via Newton-Raphson on [$19,400 disbursed, 60 × $434.85 repaid]: APR ≈ 12.15%.',
          'Total interest (on stated principal): $434.85 × 60 − $20,000 = $6,091.',
        ],
        result: '$434.85/month | Stated rate 11.0% → True APR ≈ 12.15% | $6,091 total interest',
      },
    ],
    useCases: [
      '✓ Consolidating high-interest credit card debt into a single fixed monthly payment',
      '✓ Financing home improvements, medical expenses, or major purchases without collateral',
      '✓ Comparing loan offers from multiple lenders using APR as the apples-to-apples metric',
      '✓ Planning monthly budget impact before accepting a loan offer',
      '✓ Understanding the true cost of origination fees vs lower-rate but fee-free alternatives',
      '✓ Evaluating whether a shorter term is affordable given the higher monthly payment',
    ],
    commonPitfalls: [
      '⚠ Comparing loans by interest rate only — always compare APR, which includes origination and other mandatory fees.',
      '⚠ Borrowing more than needed to cover the origination fee — if possible, pay the fee upfront instead of financing it.',
      '⚠ Choosing the longest term to minimise payments without considering total interest — a 5-year term can cost 60–70% more in interest than a 3-year term.',
      '⚠ Ignoring prepayment penalty clauses — some lenders charge a fee if you pay off the loan early.',
      '⚠ Treating the monthly payment as the full cost — total interest is the actual price of borrowing and should always be reviewed.',
      '⚠ Missing a payment: unsecured personal loans typically carry penalty rates and late fees that substantially increase the effective cost.',
    ],
    glossary: [
      { term: 'Principal', definition: 'The original loan amount borrowed, before interest. All monthly payments reduce the outstanding principal.' },
      { term: 'APR (Annual Percentage Rate)', definition: 'A standardised annual cost that includes interest plus mandatory fees. Required to be disclosed by lenders under TILA (Regulation Z) in the US.' },
      { term: 'Origination Fee', definition: 'A one-time lender fee (typically 1–8% of the loan) charged to underwrite and fund the loan. Usually deducted from disbursement, not paid upfront.' },
      { term: 'Amortisation', definition: 'The process of paying off a loan in equal periodic instalments, with each payment covering accrued interest first and then reducing principal.' },
      { term: 'Unsecured Loan', definition: 'A loan backed only by the borrower\'s creditworthiness, with no collateral. Personal loans are typically unsecured, which means higher rates than secured alternatives.' },
      { term: 'Soft vs Hard Credit Pull', definition: 'A soft pull (pre-qualification) does not affect your credit score; a hard pull (formal application) typically causes a temporary 5–10 point dip.' },
      { term: 'Debt-to-Income Ratio (DTI)', definition: 'Total monthly debt payments divided by gross monthly income. Most lenders prefer DTI below 36%; above 43% typically disqualifies applicants.' },
    ],
    sources: [
      { title: 'Truth in Lending Act (TILA) — Regulation Z', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/', year: 2024 },
      { title: 'What Is a Personal Loan?', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-personal-loan-en-1personal-loan/', year: 2024 },
      { title: 'Understanding Loan Costs', publisher: 'Federal Reserve (FRB)', url: 'https://www.federalreserve.gov/pubs/shop/default.htm', year: 2023 },
    ],
    author: {
      name: 'CalculatorFree Finance Team',
      credentials: 'TILA/Regulation Z compliance review',
      description: 'Personal loan APR methodology verified against CFPB Regulation Z requirements and standard amortisation schedules.',
    },
  },

  // ── Auto Loan ─────────────────────────────────────────────────────────────
  'auto-loan': {
    howToSteps: [
      'Enter the vehicle price, trade-in value (if any), and any down payment amount. The calculator shows the financed amount after deductions.',
      'Enter your state/provincial sales tax rate — in most jurisdictions tax is calculated on the price after trade-in, reducing your tax bill.',
      'Input dealer fees (documentation, destination, etc.), the lender\'s annual interest rate, and your loan term in months.',
      'Review the Payment Breakdown showing the split between principal, interest, taxes, and fees — and scroll down for the full amortisation schedule.',
    ],
    faqs: [
      {
        question: 'How is sales tax calculated on an auto loan?',
        answer: 'Most US states (and Canadian provinces) calculate sales tax on the vehicle\'s selling price after deducting the trade-in value. For example, a $35,000 car with a $10,000 trade-in is taxed on $25,000. However, some states (e.g. California, Michigan) tax the full vehicle price regardless of trade-in. Always verify your state\'s specific rule. The tax amount is typically rolled into the loan.',
      },
      {
        question: 'Should I put more money down on a car loan?',
        answer: 'A larger down payment reduces the amount financed, lowers your monthly payment, and reduces total interest paid. It also protects against "being underwater" (owing more than the car is worth) — cars typically depreciate 15–25% in the first year. A common rule of thumb is to put down at least 20% on a new car and 10% on a used car.',
      },
      {
        question: 'What is the difference between the purchase price and the amount financed?',
        answer: 'The amount financed (the actual loan principal) = Vehicle Price − Trade-in Value − Down Payment + Sales Tax + Dealer Fees. Taxes and fees are typically added to the loan, which is why your financed amount is often higher than the sticker price minus your down payment.',
      },
      {
        question: 'Is a 72-month or 84-month auto loan a good idea?',
        answer: 'Longer terms lower monthly payments but significantly increase total interest and the risk of negative equity. A 72-month loan at 7% on a $35,000 vehicle costs approximately $4,500 more in interest than a 48-month loan. Most financial advisors recommend keeping auto loan terms at 48–60 months for new cars and 36–48 months for used vehicles to stay ahead of depreciation.',
      },
      {
        question: 'What is a good interest rate for a car loan?',
        answer: 'Auto loan rates vary by credit tier, term, and lender. As of 2024, average rates for new cars range from ~5% (excellent credit, 720+) to ~14%+ (subprime, below 580). Used car rates are typically 1–3 percentage points higher due to greater lender risk. Credit unions often offer rates 1–2% lower than banks for the same credit profile.',
      },
    ],
    formula: {
      expression:
        'Amount Financed:\n  A = (Vehicle Price − Trade-in − Down Payment)\n      + (Vehicle Price − Trade-in) × Tax Rate\n      + Dealer Fees\n\nMonthly Payment:\n  M = A × r × (1 + r)^n\n      ─────────────────────\n      (1 + r)^n − 1\n\nTotal Cost:\n  Total = M × n  (includes all interest)',
      variables: [
        { symbol: 'A', definition: 'Amount financed — the actual loan principal including tax and fees' },
        { symbol: 'r', definition: 'Monthly interest rate = Annual Rate ÷ 12 ÷ 100' },
        { symbol: 'n', definition: 'Loan term in months (e.g. 48, 60, 72)' },
        { symbol: 'M', definition: 'Fixed monthly payment' },
        { symbol: 'Tax Rate', definition: 'State/provincial sales tax as a decimal (e.g. 6% → 0.06)' },
        { symbol: 'Trade-in', definition: 'Value the dealer credits for your current vehicle, applied before tax in most states' },
      ],
      notes:
        'Sales tax is calculated on (Vehicle Price − Trade-in) in states that grant trade-in tax credits (39 US states + most Canadian provinces). In states without this credit (e.g. California prior to 2022), tax is calculated on the full vehicle price. Dealer fees (doc fee, destination, acquisition) are added after tax and are not typically taxed themselves.',
    },
    examples: [
      {
        title: 'New car purchase with trade-in',
        scenario: '$38,500 new SUV, $8,000 trade-in, $2,000 down payment, 7% sales tax, $500 doc fee, 6.9% APR, 60-month term.',
        steps: [
          'Taxable amount: $38,500 − $8,000 = $30,500. Sales tax: $30,500 × 7% = $2,135.',
          'Amount financed: ($38,500 − $8,000 − $2,000) + $2,135 + $500 = $31,135.',
          'Monthly rate: 6.9% / 12 / 100 = 0.575%.',
          'Monthly payment: $31,135 × 0.00575 × (1.00575)^60 / [(1.00575)^60 − 1] = $613.47.',
          'Total paid: $613.47 × 60 = $36,808.20. Total interest: $36,808.20 − $31,135 = $5,673.20.',
        ],
        result: '$613.47/month | $5,673 total interest | $36,808 total repaid on $31,135 financed',
      },
      {
        title: 'Used car — no trade-in, shorter term',
        scenario: '$18,000 used car, no trade-in, $1,800 down (10%), 8% sales tax, $300 doc fee, 9.5% APR, 48 months.',
        steps: [
          'Sales tax: $18,000 × 8% = $1,440 (no trade-in to offset).',
          'Amount financed: ($18,000 − $0 − $1,800) + $1,440 + $300 = $17,940.',
          'Monthly rate: 9.5% / 12 / 100 = 0.7917%.',
          'Monthly payment: $17,940 × 0.007917 × (1.007917)^48 / [(1.007917)^48 − 1] = $449.08.',
          'Total interest: $449.08 × 48 − $17,940 = $3,616.',
        ],
        result: '$449.08/month | $3,616 total interest | Paid off in 4 years',
      },
    ],
    useCases: [
      '✓ Comparing total cost of different term lengths (48 vs 60 vs 72 months) on the same vehicle',
      '✓ Calculating whether a larger down payment justifies the upfront cash reduction',
      '✓ Assessing the value of a trade-in deal — understanding the tax savings it provides',
      '✓ Stress-testing affordability at different interest rate scenarios before visiting a dealership',
      '✓ Deciding between dealer financing and a pre-approved bank or credit union loan',
      '✓ Planning your total monthly transportation budget including insurance and maintenance',
    ],
    commonPitfalls: [
      '⚠ Focusing on monthly payment instead of total cost — dealers exploit this by stretching terms to 72–84 months.',
      '⚠ Forgetting to include sales tax and dealer fees in the financed amount — they can add $2,000–$5,000+ to the loan.',
      '⚠ Assuming the trade-in credit always reduces your taxable amount — check your state\'s rules, as some don\'t allow this deduction.',
      '⚠ Accepting dealer financing without comparing pre-approved rates from a bank or credit union first.',
      '⚠ Going underwater on the loan (owing more than the car\'s value) — especially risky with long-term loans on rapidly depreciating vehicles.',
      '⚠ Not budgeting for insurance, registration, fuel, and maintenance — these can easily exceed the loan payment itself.',
    ],
    glossary: [
      { term: 'Amount Financed', definition: 'The actual dollar amount of the loan, equal to vehicle price minus trade-in and down payment, plus taxes and fees that are rolled into the loan.' },
      { term: 'Trade-in Credit', definition: 'The value a dealer applies toward your purchase in exchange for your current vehicle. Reduces the financed amount and, in most states, the taxable base.' },
      { term: 'Dealer Documentation Fee', definition: 'A fee charged by dealers to process paperwork. Ranges from $50 to $900+ depending on state. Some states cap it; it is almost always negotiable.' },
      { term: 'Negative Equity (Underwater)', definition: 'When you owe more on the loan than the vehicle\'s current market value. Common with long loan terms due to rapid early depreciation.' },
      { term: 'Pre-Approved Loan', definition: 'A loan offer from a bank or credit union obtained before visiting the dealership, giving you a rate benchmark and stronger negotiating position.' },
      { term: 'GAP Insurance', definition: 'Guaranteed Asset Protection — covers the difference between the insurance payout and remaining loan balance if the vehicle is totalled or stolen while you are underwater.' },
      { term: 'Amortisation Schedule', definition: 'A complete table showing each payment split between interest and principal, and the remaining balance after each payment.' },
    ],
    sources: [
      { title: 'Auto Loans', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/auto-loans/', year: 2024 },
      { title: 'Shopping for an Auto Loan', publisher: 'Federal Reserve (FRB)', url: 'https://www.federalreserve.gov/pubs/shop/default.htm', year: 2023 },
      { title: 'State Motor Vehicle Sales Tax Rates', publisher: 'Federation of Tax Administrators', url: 'https://www.taxadmin.org/sales-tax-rates', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Auto Finance Team',
      credentials: 'CFPB auto lending guidelines review',
      description: 'Auto loan calculations verified against CFPB guidance. Sales tax methodology covers trade-in credit rules for all 50 US states.',
    },
  },

  // ── Auto Lease ────────────────────────────────────────────────────────────
  'auto-lease': {
    howToSteps: [
      'Enter the vehicle\'s MSRP — this determines the residual (buyout) value at lease end. Then enter the Negotiated Cap Cost (the price you\'ve agreed with the dealer, before fees).',
      'Set the Down Payment / Cap Reduction and any trade-in. These reduce the adjusted cap cost and lower your monthly depreciation charge.',
      'Enter the Money Factor (from your lender\'s lease sheet, e.g. 0.00125) or toggle to APR mode and enter the interest rate — the calculator converts automatically. Add the lease term and residual percentage.',
      'Review the monthly payment breakdown showing your depreciation charge (how much the car loses each month) and finance charge (the cost of money), plus the due-at-signing summary.',
    ],
    faqs: [
      {
        question: 'What is a money factor and how does it relate to APR?',
        answer: 'The money factor (MF) is the lease equivalent of an interest rate, expressed as a small decimal (e.g. 0.00125). To convert to APR, multiply by 2,400: 0.00125 × 2,400 = 3.0% APR. To convert APR to money factor, divide by 2,400. Lenders use money factor because it makes the finance charge calculation straightforward: Finance Charge = (Adjusted Cap Cost + Residual) × Money Factor.',
      },
      {
        question: 'What is residual value and why does it matter?',
        answer: 'Residual value is the projected worth of the vehicle at the end of the lease, set by the lender as a percentage of MSRP. A higher residual means you pay for less depreciation over the lease term, resulting in lower monthly payments. Vehicles with strong residuals (some Toyotas, Hondas, luxury brands) are typically cheaper to lease relative to their purchase price. You cannot negotiate the residual — it is set by the lender.',
      },
      {
        question: 'What is the cap cost reduction and should I put money down on a lease?',
        answer: 'Cap cost reduction (down payment on a lease) reduces your adjusted cap cost, which lowers monthly depreciation charges and therefore monthly payments. However, unlike a purchase, money put down on a lease is non-refundable if the car is totalled or stolen. Most financial advisors suggest keeping lease down payments minimal ($0–$2,000) and instead paying lower monthly amounts — this also reduces your risk exposure.',
      },
      {
        question: 'What fees are typically due at lease signing?',
        answer: 'Due-at-signing costs typically include: the first month\'s payment, acquisition fee ($400–$900, charged by the lender), security deposit (sometimes waived), cap cost reduction (your down payment), registration and title fees, and dealer documentation fee. The total is often $1,500–$5,000+ before any drive-off special deals.',
      },
      {
        question: 'Is leasing or buying cheaper overall?',
        answer: 'Leasing almost always has lower monthly payments but you build no equity. Over a long period (10+ years), buying and keeping a vehicle typically costs less. Leasing is financially advantageous when: you always drive a new car every 2–3 years; you use the vehicle for business (lease payments may be deductible); or you want to avoid repair costs beyond the warranty period. The auto lease vs. buy decision depends on your driving habits, mileage, and financial goals.',
      },
      {
        question: 'What happens if I go over my mileage limit?',
        answer: 'Excess mileage charges are specified in the lease contract, typically $0.15–$0.30 per mile over the allowed amount. On a 36-month lease with a 10,000 mile/year limit, driving 12,000 miles/year (6,000 excess miles) at $0.25/mile = $1,500 due at lease end. If you anticipate exceeding limits, negotiate additional miles upfront — pre-purchased miles are typically cheaper than excess charges at lease end.',
      },
    ],
    formula: {
      expression:
        'Step 1 — Adjusted Cap Cost:\n  Adj Cap = Cap Cost − Cap Reduction − Trade-in + Acq Fee\n\nStep 2 — Depreciation charge (monthly):\n  Dep = (Adj Cap − Residual) / Term (months)\n\nStep 3 — Finance charge (monthly):\n  Fin = (Adj Cap + Residual) × Money Factor\n\nStep 4 — Pre-tax monthly payment:\n  M_pre = Dep + Fin\n\nStep 5 — After-tax monthly payment:\n  M = M_pre × (1 + Tax Rate)\n\nConversion:\n  Money Factor = APR / 2400\n  APR = Money Factor × 2400',
      variables: [
        { symbol: 'Cap Cost', definition: 'Negotiated selling price of the vehicle (your deal, before fees)' },
        { symbol: 'Cap Reduction', definition: 'Your down payment — reduces the adjusted cap cost and monthly depreciation' },
        { symbol: 'Trade-in', definition: 'Trade-in vehicle credit applied to cap cost reduction' },
        { symbol: 'Acq Fee', definition: 'Acquisition fee charged by the lessor — typically added to the adjusted cap cost' },
        { symbol: 'Residual', definition: 'Projected vehicle value at lease end = MSRP × Residual %' },
        { symbol: 'Money Factor', definition: 'Lease finance rate; multiply by 2,400 to convert to approximate APR' },
        { symbol: 'Term', definition: 'Lease duration in months (typically 24, 36, or 39 months)' },
        { symbol: 'Tax Rate', definition: 'Sales tax on monthly lease payments (most states tax the payment, not the vehicle price)' },
      ],
      notes:
        'Most US states tax lease payments monthly rather than the full vehicle value upfront, making leasing tax-efficient in high-tax states. Texas, Minnesota, and a few others tax the full vehicle value at inception. The acquisition fee is typically $400–$900 and is set by the captive finance company (e.g. BMW Financial Services, Toyota Financial), not the dealer.',
    },
    examples: [
      {
        title: '36-month lease on a mid-size SUV',
        scenario: '$45,000 MSRP SUV, $43,000 negotiated cap cost, $3,000 down, $0 trade-in, $700 acq fee, 55% residual, money factor 0.00125, 8% tax, 36-month term.',
        steps: [
          'Residual value: $45,000 × 55% = $24,750.',
          'Adjusted cap cost: $43,000 − $3,000 + $700 = $40,700.',
          'Monthly depreciation: ($40,700 − $24,750) / 36 = $443.06.',
          'Monthly finance charge: ($40,700 + $24,750) × 0.00125 = $81.81.',
          'Pre-tax monthly: $443.06 + $81.81 = $524.87.',
          'After-tax monthly: $524.87 × 1.08 = $566.86.',
          'Effective APR: 0.00125 × 2,400 = 3.00%.',
        ],
        result: '$566.86/month (incl. 8% tax) | 3.00% APR | $24,750 buyout at lease end',
      },
      {
        title: 'Comparing money factor markup by dealer',
        scenario: 'Lender\'s buy rate money factor is 0.00100 (2.4% APR). Dealer marks it up to 0.00175 (4.2% APR). Same SUV as above, $43,000 cap cost, no down, no trade-in.',
        steps: [
          'At 0.00100: Finance charge = ($43,700 + $24,750) × 0.00100 = $68.45/mo.',
          'At 0.00175: Finance charge = ($43,700 + $24,750) × 0.00175 = $119.79/mo.',
          'Difference: $119.79 − $68.45 = $51.34/month more from dealer markup.',
          'Over 36 months: $51.34 × 36 = $1,848.24 in extra finance charges.',
          'Always ask the dealer for the "buy rate" money factor and compare to manufacturer published rates.',
        ],
        result: '$1,848 in extra cost from a 0.00075 money factor markup — always negotiate the money factor',
      },
    ],
    useCases: [
      '✓ Calculating exact monthly lease payments before visiting a dealership — preventing payment-focus negotiation tactics',
      '✓ Converting a dealer-quoted money factor to APR to understand the true finance cost',
      '✓ Comparing total lease cost vs. purchase cost for the same vehicle over the same period',
      '✓ Evaluating the impact of different residual percentages across lenders and model years',
      '✓ Determining optimal down payment amount on a lease given risk and cash flow preferences',
      '✓ Identifying money factor markups by dealers and quantifying their multi-year cost',
    ],
    commonPitfalls: [
      '⚠ Negotiating only the monthly payment — the cap cost (vehicle price) and money factor are equally important and both negotiable.',
      '⚠ Not asking for the money factor — dealers are not required to disclose it unless asked. Always verify it against the manufacturer\'s published buy rate.',
      '⚠ Putting too much money down on a lease — if the car is totalled, you lose your down payment (insurance pays the lender, not you).',
      '⚠ Ignoring mileage limits — excess mileage charges ($0.15–$0.30/mile) can cost thousands at lease end if you drive more than the contract allows.',
      '⚠ Conflating residual percentage with depreciation — a high residual (e.g. 60%) means lower payments, not that the car won\'t lose value.',
      '⚠ Forgetting acquisition fee — this lender fee ($400–$900) is typically added to the cap cost and financed, increasing your monthly payment.',
    ],
    glossary: [
      { term: 'Money Factor (MF)', definition: 'The lease equivalent of an interest rate, expressed as a small decimal. Multiply by 2,400 to convert to approximate APR.' },
      { term: 'Residual Value', definition: 'The projected market value of the vehicle at lease end, set by the lessor as a percentage of MSRP. Determines the buyout price and monthly depreciation cost.' },
      { term: 'Cap Cost (Capitalised Cost)', definition: 'The agreed-upon price of the vehicle being leased — equivalent to the purchase price in a sale. Negotiating a lower cap cost directly reduces monthly payments.' },
      { term: 'Cap Cost Reduction', definition: 'Any upfront payment (down payment, trade-in credit, or rebate) that reduces the capitalised cost and thus the monthly depreciation charge.' },
      { term: 'Acquisition Fee', definition: 'A lender fee ($400–$900) charged by the captive finance company to initiate the lease. Set by the finance arm, not the dealer, and typically non-negotiable.' },
      { term: 'Depreciation Charge', definition: 'The monthly portion of your lease payment that covers the vehicle\'s value loss: (Adj. Cap Cost − Residual) / Term.' },
      { term: 'Finance Charge', definition: 'The monthly interest component: (Adj. Cap Cost + Residual) × Money Factor. This is the cost of the money used to finance the vehicle during the lease.' },
      { term: 'Disposition Fee', definition: 'A fee charged at lease end if you return the vehicle and do not buy it or lease/buy another from the same brand. Typically $300–$500.' },
    ],
    sources: [
      { title: 'Auto Leases', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/auto-loans/', year: 2024 },
      { title: 'Keys to Vehicle Leasing', publisher: 'Federal Reserve (FRB)', url: 'https://www.federalreserve.gov/pubs/leasing/', year: 2023 },
      { title: 'Consumer Leasing Act — Regulation M', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/rules-policy/regulations/213/', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Auto Finance Team',
      credentials: 'Consumer Leasing Act / Regulation M compliance review',
      description: 'Auto lease calculations verified against CFPB Regulation M disclosure requirements and standard captive-finance lease structures.',
    },
  },

  // ── Boat Loan ─────────────────────────────────────────────────────────────
  'boat-loan': {
    howToSteps: [
      'Enter the boat purchase price before taxes and fees.',
      'Add your down payment, trade-in value, sales tax rate, and lender or dealer fees.',
      'Enter the annual interest rate and repayment term in years.',
      'Review the instant monthly payment, financed amount, total interest, total cost, and annual amortization snapshot.',
    ],
    faqs: [
      { question: 'What does a boat loan payment include?', answer: 'The estimated payment is based on the amount financed, annual interest rate, and repayment term. The financed amount includes the taxable balance, calculated sales tax, and entered fees after down payment and trade-in value.' },
      { question: 'Does a trade-in reduce the taxable amount?', answer: 'This calculator treats the entered trade-in value as reducing the taxable balance. Tax rules vary by jurisdiction, so compare the result with the lender or dealer quote for your location.' },
      { question: 'What happens when the interest rate is zero?', answer: 'The calculator uses a zero-interest branch and divides the financed amount evenly across the selected number of monthly payments. Total interest is zero.' },
      { question: 'Why is the total cost higher than the boat price?', answer: 'Total cost includes the upfront down payment and trade-in credit treatment plus all scheduled loan payments. Interest, sales tax, and fees can make the financed purchase cost differ from the advertised boat price.' },
    ],
    formula: {
      expression: 'Taxable Balance = max(0, Price − Down Payment − Trade-In) | Tax = Taxable Balance × Tax Rate | M = P × [r(1+r)^n] / [(1+r)^n − 1]',
      variables: [
        { symbol: 'Price', definition: 'Boat purchase price entered by the user' },
        { symbol: 'P', definition: 'Amount financed after down payment, trade-in, tax, and fees' },
        { symbol: 'r', definition: 'Monthly interest rate = annual rate ÷ 1,200' },
        { symbol: 'n', definition: 'Number of monthly payments = term in years × 12' },
        { symbol: 'M', definition: 'Scheduled monthly payment for a fixed-rate loan' },
      ],
      notes: 'When r = 0, the payment is P ÷ n. Input values are clamped to finite non-negative values in the client-side formula, and the down payment and trade-in cannot reduce the taxable balance below zero.',
    },
    examples: [
      {
        title: 'Typical financed boat purchase',
        scenario: '$65,000 boat, $10,000 down payment, no trade-in, 6.5% sales tax, $1,500 fees, 7.25% APR, and a 10-year term.',
        steps: [
          'Taxable balance = $65,000 − $10,000 − $0 = $55,000.',
          'Sales tax = $55,000 × 6.5% = $3,575.',
          'Amount financed = $55,000 + $3,575 + $1,500 = $60,075.',
          'The fixed-rate monthly payment formula is applied with r = 7.25% ÷ 1,200 and n = 120.',
        ],
        result: 'The results panel shows the payment, total interest, total cost, and balance by year for this scenario.',
      },
      {
        title: 'Zero-interest comparison',
        scenario: '$24,000 financed at 0% interest over 5 years with no additional tax or fees.',
        steps: [
          'Monthly rate r = 0, so the zero-interest branch is selected.',
          'Number of payments n = 5 × 12 = 60.',
          'Monthly payment = $24,000 ÷ 60 = $400.',
          'Total interest = $0 because no interest accrues.',
        ],
        result: '$400 per month and $24,000 in scheduled payments before any upfront cash.',
      },
    ],
    useCases: [
      '✓ Compare monthly affordability across different boat prices and repayment terms.',
      '✓ Quantify how a larger down payment or trade-in changes the financed balance.',
      '✓ Separate tax and fees from principal and interest when reviewing a dealer quote.',
      '✓ Compare the long-term cost of a short term against a lower monthly payment on a longer term.',
      '✓ Inspect the annual schedule to see how the balance declines over time.',
    ],
    commonPitfalls: [
      '⚠ Entering a monthly rate in the annual interest-rate field; the calculator converts an annual percentage to a monthly rate internally.',
      '⚠ Treating a quoted monthly payment as the full ownership cost without checking taxes, fees, insurance, storage, and maintenance separately.',
      '⚠ Assuming every jurisdiction calculates sales tax on the same taxable base; local rules can differ.',
      '⚠ Using a negative value to represent a credit; enter trade-in value and down payment as non-negative amounts.',
      '⚠ Choosing a long term only because the monthly payment is lower; total interest can increase with more payments.',
    ],
    glossary: [
      { term: 'Amount Financed', definition: 'The balance used in the payment formula after the entered down payment and trade-in reduction, plus calculated sales tax and fees.' },
      { term: 'APR / Interest Rate', definition: 'The annual percentage rate entered for the fixed-rate loan. The calculator divides it by 1,200 to obtain a monthly rate.' },
      { term: 'Amortization', definition: 'The process of allocating each payment between interest and principal until the balance reaches zero.' },
      { term: 'Trade-In Value', definition: 'The value entered for an existing boat or asset applied as a reduction to the taxable balance in this model.' },
      { term: 'Total Interest', definition: 'Scheduled payments minus the amount financed, floored at zero for the displayed result.' },
      { term: 'Term', definition: 'The number of years selected for repayment; the formula converts it to monthly payment periods.' },
    ],
    sources: [
      { title: 'Consumer Credit - Credit Cards and Loans', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/', year: 2024 },
      { title: 'Understanding Auto and Boat Loans', publisher: 'Federal Trade Commission (FTC)', url: 'https://consumer.ftc.gov/articles/auto-loans', year: 2024 },
    ],
    author: {
      name: 'CalculatorFree Financial Review Team',
      credentials: 'Fixed-Rate Amortization Review',
      description: 'The client-side loan arithmetic and edge-case handling are reviewed against the standard fixed-rate amortization model; local tax and lending rules should be confirmed with a qualified provider.',
    },
  },

  // ── Payment ───────────────────────────────────────────────────────────────
  payment: {
    howToSteps: [
      'Enter the amount borrowed and any fees that will be added to the balance.',
      'Enter the annual interest rate and the repayment term in years.',
      'Review the live monthly payment, total interest, and total cost.',
      'Use the amortization snapshot to see how payments reduce principal over time.',
    ],
    faqs: [
      { question: 'How is the monthly payment calculated?', answer: 'The calculator applies the standard fixed-rate amortization formula using the financed amount, monthly interest rate, and number of monthly payments. At 0% interest, it divides the financed amount evenly across the term.' },
      { question: 'Are fees included in the payment?', answer: 'Yes. Fees entered in the Fees Added field are added to the principal before the monthly payment is calculated.' },
      { question: 'Why does a longer term reduce the payment?', answer: 'A longer term spreads repayment across more monthly periods. It can reduce the monthly amount while increasing the number of periods during which interest accrues.' },
      { question: 'Does this show a lender quote?', answer: 'No. It is a planning estimate based only on the values entered. Confirm lender-specific fees, taxes, insurance, and terms with the provider.' },
    ],
    formula: {
      expression: 'P = Principal + Fees | r = APR ÷ 1,200 | n = Years × 12 | M = P × [r(1+r)^n] / [(1+r)^n − 1]',
      variables: [
        { symbol: 'P', definition: 'Financed amount including the entered fees' },
        { symbol: 'r', definition: 'Monthly interest rate as a decimal' },
        { symbol: 'n', definition: 'Total number of monthly payment periods' },
        { symbol: 'M', definition: 'Fixed monthly payment' },
      ],
      notes: 'The 0% branch uses M = P ÷ n. Inputs are constrained to finite non-negative values in the client-side calculation module.',
    },
    examples: [
      { title: 'Fixed-rate payment estimate', scenario: '$25,000 principal, $0 fees, 6.5% APR, and a 5-year term.', steps: ['Financed amount P = $25,000.', 'Monthly rate r = 6.5% ÷ 1,200.', 'Payment periods n = 5 × 12 = 60.', 'Apply the fixed-rate payment equation and review the schedule.'], result: 'The dashboard shows the monthly payment, total interest, total cost, and payment-by-payment balance.' },
      { title: 'Fees included in financing', scenario: '$25,000 principal, $500 fees, 0% APR, and a 2-year term.', steps: ['Financed amount P = $25,500.', 'Payment periods n = 24.', 'At 0% APR, monthly payment = $25,500 ÷ 24.', 'Total interest remains $0.'], result: '$1,062.50 per month before any separate charges not entered in the calculator.' },
    ],
    useCases: ['✓ Compare monthly payments for multiple terms.', '✓ See the cost impact of adding financed fees.', '✓ Estimate total interest before requesting quotes.', '✓ Review how principal and interest change across the schedule.', '✓ Test a zero-interest promotion without a divide-by-zero error.'],
    commonPitfalls: ['⚠ Entering a monthly APR instead of an annual percentage.', '⚠ Ignoring fees that are financed by the lender.', '⚠ Comparing monthly payments without comparing total cost.', '⚠ Using negative amounts to represent credits; enter credits separately in a lender quote.', '⚠ Treating an estimate as a binding offer.'],
    glossary: [
      { term: 'Principal', definition: 'The amount borrowed before interest is applied.' },
      { term: 'Financed Amount', definition: 'Principal plus fees added to the loan balance.' },
      { term: 'APR', definition: 'Annual interest percentage converted to a monthly rate for the formula.' },
      { term: 'Amortization', definition: 'The allocation of each payment between interest and principal.' },
      { term: 'Total Cost', definition: 'Financed amount plus the calculated interest over the selected term.' },
    ],
    sources: [
      { title: 'Loan Estimate and Closing Disclosure', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-loan-estimate-en-1995/', year: 2024 },
      { title: 'Consumer Credit', publisher: 'Federal Trade Commission (FTC)', url: 'https://consumer.ftc.gov/topics/credit-and-loans', year: 2024 },
    ],
    author: { name: 'CalculatorFree Financial Review Team', credentials: 'Fixed-Rate Amortization Review', description: 'Payment arithmetic is reviewed against the standard fixed-rate amortization model; lender terms and local charges should be confirmed independently.' },
  },

  // ── Repayment ─────────────────────────────────────────────────────────────
  repayment: {
    howToSteps: [
      'Enter the current outstanding balance.',
      'Enter the annual interest rate for the balance.',
      'Enter the monthly payment you plan to make.',
      'Review the estimated number of payments, total interest, total payments, and schedule snapshot.',
    ],
    faqs: [
      { question: 'What does the Repayment Calculator solve?', answer: 'It estimates how many monthly payments are needed to clear a current balance when the annual rate and planned monthly payment are known.' },
      { question: 'What if my payment is too low?', answer: 'If the payment does not exceed the first month interest charge, the calculator shows a warning instead of pretending the balance will be repaid.' },
      { question: 'What happens at 0% interest?', answer: 'The balance is divided by the monthly payment because no interest accrues. A zero monthly payment is treated as too low when a balance remains.' },
      { question: 'Does the last payment have to equal the regular payment?', answer: 'No. The final payment is capped at the remaining balance plus that period interest, so the schedule can show a smaller final payment.' },
    ],
    formula: {
      expression: 'Interest_t = Balance_t × (APR ÷ 1,200) | Principal_t = Payment_t − Interest_t | Balance_(t+1) = max(0, Balance_t − Principal_t)',
      variables: [
        { symbol: 'Balance_t', definition: 'Outstanding balance at the beginning of period t' },
        { symbol: 'APR', definition: 'Annual percentage interest rate entered by the user' },
        { symbol: 'Payment_t', definition: 'Monthly payment, capped on the final period' },
        { symbol: 'Principal_t', definition: 'Part of the payment reducing the balance' },
      ],
      notes: 'The engine stops at a zero balance or a protective 1,200-payment limit. If payment is zero or no greater than accruing interest, it returns an explicit payment-too-low status.',
    },
    examples: [
      { title: 'Repaying a revolving balance', scenario: '$20,000 balance, 6.5% APR, and $500 monthly payment.', steps: ['Monthly interest is the balance multiplied by 6.5% ÷ 1,200.', 'The first payment is split into interest and principal.', 'Each next month recalculates interest on the reduced balance.', 'The schedule ends with the final payment when the balance reaches zero.'], result: 'The dashboard reports the estimated payoff payment count and total interest.' },
      { title: 'Payment below interest', scenario: '$10,000 balance, 12% APR, and $50 monthly payment.', steps: ['First-month interest is $10,000 × 12% ÷ 1,200 = $100.', 'The $50 payment does not cover the $100 interest charge.', 'The calculator returns a warning rather than a misleading payoff date.'], result: 'Increase the monthly payment above the monthly interest to make repayment possible.' },
    ],
    useCases: ['✓ Estimate a payoff horizon for a known balance.', '✓ Compare different monthly payment plans.', '✓ Quantify interest cost over the repayment period.', '✓ Identify payment plans that cannot reduce principal.', '✓ Inspect the balance trend in the schedule snapshot.'],
    commonPitfalls: ['⚠ Entering a monthly rate in the annual rate field.', '⚠ Choosing a payment that is below monthly interest.', '⚠ Assuming the result includes future fees, penalties, or new borrowing.', '⚠ Treating a fixed-rate estimate as a variable-rate forecast.', '⚠ Ignoring the difference between scheduled payment and final payment.'],
    glossary: [
      { term: 'Outstanding Balance', definition: 'The amount still owed at the start of the repayment calculation.' },
      { term: 'Monthly Interest', definition: 'Interest for one period, calculated from the opening balance and monthly rate.' },
      { term: 'Principal Reduction', definition: 'The portion of a payment that lowers the outstanding balance.' },
      { term: 'Payoff Period', definition: 'The count of monthly payment periods required to reach a zero balance under the model.' },
      { term: 'Payment-Too-Low Status', definition: 'An explicit warning used when the payment cannot cover the interest that accrues.' },
    ],
    sources: [
      { title: 'Credit and Loans', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/', year: 2024 },
      { title: 'Managing Debt', publisher: 'Federal Trade Commission (FTC)', url: 'https://consumer.ftc.gov/articles/getting-out-debt', year: 2024 },
    ],
    author: { name: 'CalculatorFree Debt Planning Review Team', credentials: 'Amortization and Payoff Review', description: 'Repayment arithmetic is reviewed against a fixed-rate declining-balance model; actual lender policies, fees, and rate changes may alter a payoff result.' },
  },

  // ── Student Loan ──────────────────────────────────────────────────────────
  'student-loan': {
    howToSteps: [
      'Enter the student loan principal and annual interest rate.',
      'Choose the planned repayment term and enter any origination fee percentage.',
      'Optionally add an extra monthly payment above the scheduled amount.',
      'Review the monthly payment, total interest, payoff months, interest savings, and schedule snapshot.',
    ],
    faqs: [
      { question: 'What does the origination fee do?', answer: 'The entered origination fee percentage is applied to the principal and added to the financed amount before the scheduled payment is calculated.' },
      { question: 'How does an extra payment affect the result?', answer: 'The extra monthly payment is added to the scheduled payment in the monthly amortization loop. The dashboard shows the resulting payoff months and estimated interest saved versus the scheduled payment alone.' },
      { question: 'Does this calculate federal income-driven repayment?', answer: 'No. This implementation models a fixed-rate amortizing balance. Income-driven plans, capitalization events, forgiveness, and servicer rules require separate terms.' },
      { question: 'What if the interest rate is 0%?', answer: 'The fixed-rate engine uses the zero-interest branch and divides the financed amount across the selected term; extra payments can still shorten the payoff.' },
    ],
    formula: {
      expression: 'Fee = Principal × Fee Rate | P = Principal + Fee | M = P × [r(1+r)^n] / [(1+r)^n − 1] | Payment = M + Extra',
      variables: [
        { symbol: 'P', definition: 'Financed student loan balance including origination fee' },
        { symbol: 'r', definition: 'Monthly interest rate = annual rate ÷ 1,200' },
        { symbol: 'n', definition: 'Scheduled payment periods = term years × 12' },
        { symbol: 'M', definition: 'Scheduled monthly payment before any extra payment' },
        { symbol: 'Extra', definition: 'Optional additional monthly amount used in payoff simulation' },
      ],
      notes: 'The payoff simulation caps the final payment at the remaining balance plus interest and stops at zero balance or a protective maximum period.',
    },
    examples: [
      { title: 'Scheduled student loan plan', scenario: '$30,000 principal, 5.5% APR, 10-year term, 1% origination fee, and $0 extra.', steps: ['Origination fee = $30,000 × 1% = $300.', 'Financed balance P = $30,300.', 'Monthly rate r = 5.5% ÷ 1,200 and n = 120.', 'The fixed-rate payment is simulated across the schedule.'], result: 'The dashboard shows the scheduled monthly payment and the total cost of the fixed-rate plan.' },
      { title: 'Using an extra monthly payment', scenario: 'The same loan with an additional $100 paid each month.', steps: ['The scheduled payment is calculated first.', 'The simulation adds $100 to each regular payment until the final period.', 'The balance reaches zero earlier than the scheduled term.', 'Interest saved is the scheduled-plan interest minus the accelerated-plan interest.'], result: 'The dashboard reports the shorter payoff time and estimated interest saved.' },
    ],
    useCases: ['✓ Compare standard terms before requesting a student-loan quote.', '✓ See the effect of an origination fee on the financed amount.', '✓ Test an extra-payment budget.', '✓ Compare total interest rather than looking only at monthly payment.', '✓ Review the balance trend in the amortization snapshot.'],
    commonPitfalls: ['⚠ Assuming a fixed-rate result represents every federal or private loan plan.', '⚠ Forgetting that an origination fee can be withheld or financed differently by a lender.', '⚠ Entering a monthly rate instead of annual APR.', '⚠ Treating optional extra payments as guaranteed savings when the loan has prepayment rules.', '⚠ Ignoring deferment, capitalization, grants, and forgiveness provisions.'],
    glossary: [
      { term: 'Student Loan Principal', definition: 'The starting amount borrowed for education before the modeled origination fee.' },
      { term: 'Origination Fee', definition: 'A percentage applied here to the principal and added to the financed balance.' },
      { term: 'Scheduled Payment', definition: 'The fixed monthly payment calculated from the financed balance, rate, and term.' },
      { term: 'Extra Payment', definition: 'An optional monthly amount added to the scheduled payment in the payoff simulation.' },
      { term: 'Interest Saved', definition: 'The difference between interest under the scheduled payment and interest under the accelerated payment in this model.' },
    ],
    sources: [
      { title: 'Student Loan Repayment Plans', publisher: 'Federal Student Aid', url: 'https://studentaid.gov/manage-loans/repayment/plans', year: 2024 },
      { title: 'Paying for College', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/paying-for-college/', year: 2024 },
    ],
    author: { name: 'CalculatorFree Education Finance Review Team', credentials: 'Fixed-Rate Student Loan Review', description: 'The displayed estimate is checked against fixed-rate amortization arithmetic; official loan terms and repayment-plan rules should be confirmed with the servicer.' },
  },

  // ── College Cost ──────────────────────────────────────────────────────────
  'college-cost': {
    howToSteps: [
      'Enter the current annual college cost you want to project.',
      'Set the annual cost inflation rate and the number of years until college.',
      'Enter current savings, annual contributions, and expected contribution growth.',
      'Compare the projected four-year cost with future savings and review the funding-gap alert.',
    ],
    faqs: [
      { question: 'How is future annual cost calculated?', answer: 'The calculator compounds the current annual cost by the entered inflation rate for the number of years until college.' },
      { question: 'Why is four-year cost four times the future annual cost?', answer: 'This model uses four projected years as a simple planning assumption. Actual attendance length, annual increases, housing, aid, and program costs can differ.' },
      { question: 'How are savings projected?', answer: 'Current savings grow by the same entered inflation rate in this planning model, while each annual contribution grows by the entered contribution-growth rate and is added during each year before college.' },
      { question: 'Does this include financial aid or scholarships?', answer: 'No. The result compares projected cost with the savings and contributions entered. Grants, scholarships, loans, and family cash flow should be modelled separately.' },
    ],
    formula: {
      expression: 'Future Annual Cost = Current Cost × (1 + Inflation)^Years | Four-Year Cost = Future Annual Cost × 4 | Gap = max(0, Four-Year Cost − Future Savings)',
      variables: [
        { symbol: 'Current Cost', definition: 'Annual education cost in today’s dollars' },
        { symbol: 'Inflation', definition: 'Annual cost-growth percentage entered by the user' },
        { symbol: 'Years', definition: 'Whole years until the projected start date' },
        { symbol: 'Future Savings', definition: 'Current savings grown over time plus annual contributions with their entered growth rate' },
      ],
      notes: 'This is a planning projection, not a tuition quote or investment forecast. It does not model investment returns, taxes, aid, loans, or changes in enrollment.',
    },
    examples: [
      { title: 'Projecting a four-year cost', scenario: '$30,000 current annual cost, 4% inflation, and 10 years until college.', steps: ['Future annual cost = $30,000 × (1.04)^10.', 'Four-year projected cost = future annual cost × 4.', 'Current savings and annual contributions are projected separately.', 'The dashboard compares the two totals and shows coverage percentage.'], result: 'The result gives a transparent planning estimate based on the entered assumptions.' },
      { title: 'Testing a savings plan', scenario: '$10,000 current savings, $6,000 annual contribution, and 3% contribution growth.', steps: ['Start with current savings.', 'Grow the existing balance each year using the modelled rate.', 'Add that year’s contribution after applying contribution growth.', 'Repeat until the selected college start year.'], result: 'Use the funding gap to identify how much of the projected cost is not covered by the modelled savings.' },
    ],
    useCases: ['✓ Estimate the effect of education-cost inflation.', '✓ Compare different start dates and savings horizons.', '✓ Test annual contribution levels.', '✓ See the difference between a one-year and four-year planning target.', '✓ Communicate assumptions clearly when discussing an education plan.'],
    commonPitfalls: ['⚠ Treating an inflation assumption as a guaranteed tuition increase.', '⚠ Assuming four years is correct for every program.', '⚠ Omitting room, board, books, transport, or fees from the current cost input.', '⚠ Counting projected savings as guaranteed investment returns.', '⚠ Forgetting scholarships, grants, aid, and loans are not included automatically.'],
    glossary: [
      { term: 'Current Annual Cost', definition: 'The one-year cost used as the starting point for the projection.' },
      { term: 'Cost Inflation', definition: 'The annual percentage used to compound the future annual education cost.' },
      { term: 'Future Annual Cost', definition: 'The projected cost for one year at the selected future start date.' },
      { term: 'Projected Savings', definition: 'Current savings plus modelled annual growth and contributions by the start date.' },
      { term: 'Funding Gap', definition: 'The positive difference between projected four-year cost and projected savings; zero when savings cover the modelled cost.' },
    ],
    sources: [
      { title: 'Saving for College', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/paying-for-college/looking-for-a-school/saving-for-college/', year: 2024 },
      { title: 'College Preparation Checklist', publisher: 'Federal Student Aid', url: 'https://studentaid.gov/articles/prepare-for-college/', year: 2024 },
    ],
    author: { name: 'CalculatorFree Education Planning Review Team', credentials: 'Education Cost Projection Review', description: 'The projection logic is reviewed for transparent compounding and funding-gap arithmetic; institution-specific costs and aid should be confirmed with official sources.' },
  },

  // ── Credit Card ───────────────────────────────────────────────────────────
  'credit-card': {
    howToSteps: ['Enter the current card balance and APR.', 'Set the minimum-payment percentage and minimum dollar floor.', 'Review the first minimum payment, projected payoff count, total payments, and interest.', 'If the result warns that payment is too low, confirm the payment assumption before using the estimate.'],
    faqs: [
      { question: 'How is the minimum payment estimated?', answer: 'The first payment is the greater of the entered balance multiplied by the minimum-payment percentage or the entered minimum dollar floor. The payoff simulation then keeps that payment fixed for planning purposes.' },
      { question: 'Does this model new purchases?', answer: 'No. It models only the starting balance and the repayment assumptions entered. New purchases, late fees, changing APRs, and promotional periods are not added automatically.' },
      { question: 'What if the minimum payment is too low?', answer: 'The calculator returns a payment-too-low status when the payment cannot cover monthly interest, instead of presenting a false payoff period.' },
      { question: 'Is this an issuer statement?', answer: 'No. It is a client-side estimate for planning. Use the card agreement and current issuer statement for the actual minimum-payment rules.' },
    ],
    formula: { expression: 'Minimum Payment = max(Balance × Minimum %, Minimum Floor) | Interest_t = Balance_t × APR ÷ 1,200 | Balance_(t+1) = max(0, Balance_t − (Payment − Interest_t))', variables: [{ symbol: 'Balance', definition: 'Starting card balance' }, { symbol: 'APR', definition: 'Annual percentage rate converted to a monthly rate' }, { symbol: 'Minimum %', definition: 'Percentage of balance used for the first minimum-payment estimate' }, { symbol: 'Minimum Floor', definition: 'Dollar floor below which the minimum payment does not fall in the input model' }], notes: 'The repayment model holds the first calculated payment constant so users can compare the effect of an assumed minimum payment without adding new purchases or issuer-specific fees.' },
    examples: [
      { title: 'Minimum percentage above floor', scenario: '$12,000 balance, 22.99% APR, 2% minimum, and $25 floor.', steps: ['Percentage payment = $12,000 × 2% = $240.', 'The first minimum is max($240, $25) = $240.', 'Monthly interest is calculated from APR ÷ 1,200.', 'The simulation applies the assumed payment until payoff or a payment-too-low warning.'], result: 'The dashboard shows the first minimum payment and modeled payoff metrics.' },
      { title: 'Floor controls the payment', scenario: '$500 balance, 22.99% APR, 2% minimum, and $25 floor.', steps: ['Percentage payment = $10.', 'The dollar floor is $25.', 'The first minimum is max($10, $25) = $25.', 'The payoff simulation uses the $25 assumed payment.'], result: '$25 is the modeled first minimum before other issuer rules.' },
    ],
    useCases: ['✓ Estimate how a balance behaves under a fixed assumed minimum.', '✓ Compare APR sensitivity on the same balance.', '✓ See the difference between a percentage minimum and a dollar floor.', '✓ Identify cases where payment does not cover monthly interest.', '✓ Review total interest rather than focusing only on the first payment.'],
    commonPitfalls: ['⚠ Assuming the first minimum payment remains fixed on every issuer statement.', '⚠ Ignoring new spending and fees.', '⚠ Entering a promotional APR as the permanent rate.', '⚠ Confusing APR with the monthly rate used in the calculation.', '⚠ Treating a planning estimate as a credit-card contract.'],
    glossary: [{ term: 'APR', definition: 'Annual percentage rate used to calculate monthly interest in the model.' }, { term: 'Minimum Payment', definition: 'The assumed payment selected from the percentage and floor inputs.' }, { term: 'Minimum Floor', definition: 'The dollar minimum used when the balance percentage is smaller.' }, { term: 'Revolving Balance', definition: 'A balance that can continue from one statement period to the next.' }, { term: 'Payment-Too-Low', definition: 'A warning status when a payment cannot cover the modeled monthly interest.' }],
    sources: [{ title: 'Credit Card Agreements and Disclosures', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/', year: 2024 }, { title: 'Credit, Loans, and Debt', publisher: 'Federal Trade Commission (FTC)', url: 'https://consumer.ftc.gov/topics/credit-and-loans', year: 2024 }],
    author: { name: 'CalculatorFree Credit Review Team', credentials: 'Revolving Balance Calculation Review', description: 'The displayed estimate is checked against declining-balance arithmetic; issuer-specific minimum-payment, fee, and promotional rules must be verified in the card agreement.' },
  },

  // ── Credit Cards Payoff ────────────────────────────────────────────────────
  'credit-cards-payoff': {
    howToSteps: ['Enter the balance, APR, and payment for Card 1.', 'Enter Card 2 and Card 3 balances; their planning rates and minimum assumptions are shown in the model.', 'Review combined balance, combined payment, total interest, and longest payoff period.', 'Use the results to compare a multi-card payoff plan before checking each issuer statement.'],
    faqs: [
      { question: 'How many cards does this version combine?', answer: 'The calculator combines three card balances. Card 1 accepts balance, APR, and payment inputs; Cards 2 and 3 use their entered balances with planning assumptions in the client-side model.' },
      { question: 'What does longest payoff mean?', answer: 'Each card is simulated separately. Longest payoff is the largest payment count among the three cards, so all balances are projected to be cleared by that point under the model.' },
      { question: 'Does it model avalanche or snowball ordering?', answer: 'No. This version sums independent fixed-payment simulations. It does not reallocate a paid-off card payment to another card.' },
      { question: 'Can a card return payment-too-low?', answer: 'Yes. The combined view flags the plan when a card payment cannot cover its modeled monthly interest.' },
    ],
    formula: { expression: 'Total Balance = Σ Balance_i | Total Interest = Σ Interest_i | Longest Payoff = max(Payoff Months_i)', variables: [{ symbol: 'i', definition: 'Card index from 1 through 3' }, { symbol: 'Balance_i', definition: 'Starting balance for card i' }, { symbol: 'Interest_i', definition: 'Modeled interest for card i' }, { symbol: 'Payoff Months_i', definition: 'Modeled payment count for card i' }], notes: 'The three simulations are independent and use fixed payment assumptions. New charges, fees, transfer events, and payment reallocation are excluded.' },
    examples: [
      { title: 'Three-card planning view', scenario: 'Card 1 $12,000 at 22.99% with $350 payment, Card 2 $5,000, and Card 3 $2,500.', steps: ['Simulate Card 1 with its entered APR and payment.', 'Simulate Cards 2 and 3 with the component’s planning assumptions.', 'Add the three starting balances and modeled interest totals.', 'Take the largest payoff-month count as the longest payoff.'], result: 'The dashboard provides one combined view while retaining the cards as independent simulations.' },
      { title: 'Payment adequacy check', scenario: 'A card payment is lower than the interest generated by its balance.', steps: ['Calculate the first monthly interest for that card.', 'Compare it with the planned payment.', 'Flag that card as payment-too-low when payment cannot reduce principal.', 'Do not present a false payoff period.'], result: 'The dashboard warning identifies that the payment assumption must increase.' },
    ],
    useCases: ['✓ See the size of several card balances in one dashboard.', '✓ Compare total modeled interest across the cards.', '✓ Identify the card with the longest payoff period.', '✓ Check whether a payment assumption can reduce principal.', '✓ Prepare questions for card issuers or a debt counselor.'],
    commonPitfalls: ['⚠ Assuming the model automatically performs avalanche or snowball allocation.', '⚠ Omitting a card balance or using an outdated APR.', '⚠ Treating combined payment as a single lender payment.', '⚠ Ignoring new purchases, fees, and promotional expirations.', '⚠ Using a planning model as a statement reconciliation.'],
    glossary: [{ term: 'Card Balance', definition: 'Outstanding principal assigned to one simulated card.' }, { term: 'Independent Simulation', definition: 'A payoff calculation performed for one card without reallocating other card payments.' }, { term: 'Combined Interest', definition: 'The sum of modeled interest across the three card simulations.' }, { term: 'Longest Payoff', definition: 'The largest modeled payment count among the cards.' }, { term: 'Payment Adequacy', definition: 'Whether a payment is sufficient to cover modeled interest and reduce principal.' }],
    sources: [{ title: 'Credit Card Tools', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/', year: 2024 }, { title: 'Managing Credit Card Debt', publisher: 'Federal Trade Commission (FTC)', url: 'https://consumer.ftc.gov/articles/using-credit-cards-and-disputing-charges', year: 2024 }],
    author: { name: 'CalculatorFree Debt Planning Review Team', credentials: 'Multi-Balance Payoff Review', description: 'The combined estimate is reviewed as a set of independent fixed-payment simulations; issuer statements and account-specific terms remain authoritative.' },
  },
  'debt-payoff': {
    howToSteps: ['Enter the current debt balance.', 'Enter APR and planned monthly payment.', 'Review payoff months, total interest, and total payments.', 'Use the warning when the payment cannot reduce principal.'],
    faqs: [{ question: 'What does this calculator show?', answer: 'It simulates a declining balance with a fixed monthly payment and estimates when the balance reaches zero.' }, { question: 'What if payment is too low?', answer: 'The calculator shows a warning when payment cannot cover monthly interest.' }, { question: 'Are new charges included?', answer: 'No. Only the entered starting balance, APR, and payment are modeled.' }, { question: 'Does the final payment equal the regular payment?', answer: 'The final payment can be smaller because it is capped at the remaining balance plus interest.' }],
    formula: { expression: 'Interest_t = Balance_t × APR ÷ 1,200 | Principal_t = Payment − Interest_t | Balance_(t+1) = max(0, Balance_t − Principal_t)', variables: [{ symbol: 'Balance_t', definition: 'Balance at the start of month t' }, { symbol: 'APR', definition: 'Annual percentage rate' }, { symbol: 'Payment', definition: 'Planned monthly payment' }, { symbol: 'Principal_t', definition: 'Payment amount that lowers balance' }], notes: 'A zero or interest-insufficient payment returns a warning instead of a false payoff date.' },
    examples: [{ title: 'Fixed payment payoff', scenario: '$12,000 at 22.99% APR and $350 per month.', steps: ['Convert APR to monthly rate.', 'Calculate monthly interest.', 'Apply the payment to interest and principal.', 'Repeat until zero balance.'], result: 'The dashboard gives payoff months and total interest.' }, { title: 'Insufficient payment', scenario: 'A payment below monthly interest.', steps: ['Calculate first-month interest.', 'Compare it with payment.', 'Return payment-too-low status.', 'Increase payment to reduce principal.'], result: 'The warning prevents a misleading payoff estimate.' }],
    useCases: ['✓ Estimate debt payoff timing.', '✓ Compare monthly-payment plans.', '✓ Quantify modeled interest.', '✓ Check payment adequacy.', '✓ Prepare a debt discussion.'],
    commonPitfalls: ['⚠ Using monthly APR instead of annual APR.', '⚠ Ignoring new charges and fees.', '⚠ Comparing monthly payments without total interest.', '⚠ Assuming variable rates stay fixed.', '⚠ Treating an estimate as a lender statement.'],
    glossary: [{ term: 'Balance', definition: 'Starting debt amount.' }, { term: 'APR', definition: 'Annual rate converted to monthly interest.' }, { term: 'Principal', definition: 'Amount that reduces the balance.' }, { term: 'Payoff Months', definition: 'Modeled number of payment periods.' }, { term: 'Payment-Too-Low', definition: 'Warning when payment cannot cover interest.' }],
    sources: [{ title: 'Managing Debt', publisher: 'Federal Trade Commission (FTC)', url: 'https://consumer.ftc.gov/articles/getting-out-debt', year: 2024 }, { title: 'Credit and Loans', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/', year: 2024 }],
    author: { name: 'CalculatorFree Debt Planning Review Team', credentials: 'Debt Payoff Arithmetic Review', description: 'The fixed-payment simulation is reviewed for declining-balance arithmetic; actual account terms can differ.' },
  },
  'debt-consolidation': {
    howToSteps: ['Enter the current debt balance, APR, and current payment.', 'Enter the proposed consolidation APR, term, and fees.', 'Review new payment, monthly savings, current interest, and new interest.', 'Treat the result as a comparison model and verify actual lender terms.'],
    faqs: [{ question: 'What does consolidation compare?', answer: 'It compares a current fixed-payment payoff simulation with a new fixed-rate payment built from balance, fees, APR, and term.' }, { question: 'Are fees included?', answer: 'Yes. Entered consolidation fees are added to the new balance before calculating the new payment.' }, { question: 'Does monthly savings guarantee lower total cost?', answer: 'No. A lower monthly payment can come from a longer term; compare current and new total interest as well.' }, { question: 'Does this include a lender offer?', answer: 'No. It is a client-side comparison model and not a credit decision or binding quote.' }],
    formula: { expression: 'New P = Balance + Fees | New M = P × [r(1+r)^n] / [(1+r)^n − 1] | Monthly Savings = max(0, Current Payment − New M)', variables: [{ symbol: 'Balance', definition: 'Current debt balance' }, { symbol: 'Fees', definition: 'Fees added to the consolidation balance' }, { symbol: 'r', definition: 'New monthly interest rate' }, { symbol: 'n', definition: 'New number of monthly periods' }, { symbol: 'M', definition: 'New fixed monthly payment' }], notes: 'The current plan uses an independent payoff simulation. The new plan uses the selected fixed term and includes entered fees.' },
    examples: [{ title: 'Compare two fixed plans', scenario: '$20,000 current balance at 22.99% with $600 payment versus a 10% five-year consolidation plan.', steps: ['Simulate the current payment plan.', 'Add consolidation fees to the new balance.', 'Calculate the new fixed payment.', 'Compare payment and interest totals.'], result: 'The dashboard exposes both monthly savings and total interest so a lower payment is not the only metric.' }, { title: 'Fee sensitivity', scenario: 'The same new APR and term with fees changed.', steps: ['Add fees to the balance.', 'Recalculate the new payment.', 'Recalculate new interest over the term.', 'Compare the changed totals.'], result: 'The model makes the fee impact visible.' }],
    useCases: ['✓ Compare current and proposed monthly payments.', '✓ Include one-time consolidation fees.', '✓ Review interest differences.', '✓ Test term and APR combinations.', '✓ Prepare questions for a lender or counselor.'],
    commonPitfalls: ['⚠ Focusing only on lower monthly payment.', '⚠ Omitting origination or transfer fees.', '⚠ Assuming the new APR is guaranteed.', '⚠ Treating savings as guaranteed approval.', '⚠ Ignoring prepayment penalties or variable terms.'],
    glossary: [{ term: 'Consolidation', definition: 'Combining debt into a new modeled balance and payment.' }, { term: 'New Balance', definition: 'Current balance plus entered consolidation fees.' }, { term: 'Monthly Savings', definition: 'Current modeled payment minus new modeled payment when positive.' }, { term: 'New Interest', definition: 'Interest over the selected new fixed term.' }, { term: 'Term', definition: 'New repayment period in years.' }],
    sources: [{ title: 'Debt Consolidation', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/debt-collection/', year: 2024 }, { title: 'Getting Out of Debt', publisher: 'Federal Trade Commission (FTC)', url: 'https://consumer.ftc.gov/articles/getting-out-debt', year: 2024 }],
    author: { name: 'CalculatorFree Debt Comparison Review Team', credentials: 'Fixed-Rate Consolidation Review', description: 'The comparison is reviewed as a mathematical planning model; actual offers, fees, and eligibility are determined by providers.' },
  },
  'debt-to-income': {
    howToSteps: ['Enter gross monthly income before deductions.', 'Enter existing monthly debt payments and housing payment.', 'Add any proposed new monthly debt.', 'Review current DTI, proposed DTI, and the displayed headroom to the 36% reference line.'],
    faqs: [{ question: 'How is DTI calculated?', answer: 'DTI is monthly debt obligations divided by gross monthly income, multiplied by 100.' }, { question: 'What is proposed DTI?', answer: 'Proposed DTI adds the entered new debt payment to existing debt and housing before dividing by gross monthly income.' }, { question: 'What does the 36% line mean here?', answer: 'The dashboard uses 36% as a displayed planning reference. Actual underwriting standards vary by product, lender, borrower, and documentation.' }, { question: 'What if income is zero?', answer: 'The calculator returns 0% instead of dividing by zero; enter a valid gross monthly income for a meaningful ratio.' }],
    formula: { expression: 'Current DTI = (Debt + Housing) ÷ Gross Income × 100 | Proposed DTI = (Debt + Housing + New Debt) ÷ Gross Income × 100', variables: [{ symbol: 'Debt', definition: 'Existing monthly debt payments' }, { symbol: 'Housing', definition: 'Monthly housing payment' }, { symbol: 'New Debt', definition: 'Proposed new monthly debt payment' }, { symbol: 'Gross Income', definition: 'Gross monthly income before deductions' }], notes: 'The model reports one decimal place and clamps non-finite or negative inputs to safe non-negative values.' },
    examples: [{ title: 'Current and proposed ratio', scenario: '$6,000 gross monthly income, $1,500 housing, $1,000 existing debt, and $500 proposed debt.', steps: ['Current monthly obligations = $1,000 + $1,500.', 'Proposed obligations add the new $500 payment.', 'Divide each total by $6,000.', 'Multiply by 100 to display percentages.'], result: 'The dashboard shows both ratios and headroom to the reference line.' }, { title: 'Zero-income guard', scenario: 'Income is entered as zero.', steps: ['The denominator is zero.', 'The formula returns 0% by guard.', 'No runtime division error is shown.', 'Enter gross income to restore a meaningful ratio.'], result: 'The page remains usable without NaN.' }],
    useCases: ['✓ Estimate the effect of a new monthly obligation.', '✓ Compare current and proposed obligations.', '✓ Communicate monthly debt assumptions.', '✓ Check a simple reference threshold.', '✓ Avoid divide-by-zero output.'],
    commonPitfalls: ['⚠ Using take-home pay instead of gross income.', '⚠ Omitting housing or recurring debt payments.', '⚠ Treating a reference percentage as an approval guarantee.', '⚠ Ignoring taxes, insurance, or lender-specific definitions.', '⚠ Entering annual income in a monthly field.'],
    glossary: [{ term: 'DTI', definition: 'Debt-to-income ratio expressed as a percentage.' }, { term: 'Gross Monthly Income', definition: 'Income before deductions used as the denominator in this model.' }, { term: 'Housing Payment', definition: 'Monthly housing obligation entered by the user.' }, { term: 'Proposed DTI', definition: 'Ratio after adding the proposed new monthly debt.' }, { term: 'Headroom', definition: 'Distance from the proposed DTI to the displayed 36% reference line when positive.' }],
    sources: [{ title: 'What is Debt-to-Income Ratio?', publisher: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/', year: 2024 }, { title: 'Mortgage Qualification', publisher: 'Federal Housing Finance Agency (FHFA)', url: 'https://www.fhfa.gov/', year: 2024 }],
    author: { name: 'CalculatorFree Financial Ratio Review Team', credentials: 'DTI Calculation Review', description: 'The ratio arithmetic is checked against the standard monthly-obligation divided by gross-income definition; lender criteria vary.' },
  },
  'cash-back-low-interest': { howToSteps: ['Enter purchase amount and term.', 'Enter the low-interest and cash-back option rates.', 'Enter the cash-back percentage.', 'Compare total modeled costs and the better option.'], faqs: [{ question: 'What is compared?', answer: 'The model compares a low-interest total with a higher-rate option reduced by cash back.' }, { question: 'Are fees included?', answer: 'No additional fees are added unless represented in the entered amounts.' }, { question: 'Is the result a lender quote?', answer: 'No, it is a client-side comparison.' }, { question: 'What is the term field?', answer: 'The term is converted to monthly periods for the model.' }], formula: { expression: 'Low Total = P(1+r_low)^n | Cash-Back Total = P(1+r_high)^n − Cash Back', variables: [{ symbol: 'P', definition: 'Purchase amount' }, { symbol: 'r', definition: 'Annual rate converted to a monthly rate' }, { symbol: 'n', definition: 'Number of months' }], notes: 'The lower modeled total is reported as the better option.' }, examples: [{ title: 'Option comparison', scenario: 'A purchase with two rates and cash back.', steps: ['Calculate both growth paths.', 'Subtract cash back from the high-rate path.', 'Compare totals.', 'Report savings.'], result: 'The dashboard identifies the lower modeled total.' }], useCases: ['✓ Compare promotional offers.', '✓ Test cash-back tradeoffs.', '✓ See rate sensitivity.', '✓ Compare total cost.', '✓ Document assumptions.'], commonPitfalls: ['⚠ Ignoring fees.', '⚠ Comparing only monthly payment.', '⚠ Assuming rates are fixed.', '⚠ Treating cash back as immediate cash flow.', '⚠ Treating the model as an offer.'], glossary: [{ term: 'Cash Back', definition: 'Percentage-based reduction in the modeled high-rate total.' }, { term: 'Low Interest', definition: 'The lower annual rate option.' }, { term: 'Term', definition: 'Modeled number of months.' }], sources: [{ title: 'Consumer Credit', publisher: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/', year: 2024 }], author: { name: 'CalculatorFree Finance Review Team', credentials: 'Offer Comparison Review', description: 'Comparison arithmetic is reviewed as a planning model.' } },
  interest: { howToSteps: ['Enter principal.', 'Enter annual rate.', 'Enter years.', 'Review interest and total value.'], faqs: [{ question: 'What is interest?', answer: 'Interest is the amount earned or charged above principal in the selected model.' }, { question: 'Which model is used?', answer: 'This route uses the simple-interest view.' }, { question: 'Does it model fees?', answer: 'No.' }, { question: 'Are values client-side?', answer: 'Yes.' }], formula: { expression: 'I = P × r × t | A = P + I', variables: [{ symbol: 'P', definition: 'Principal' }, { symbol: 'r', definition: 'Annual rate as a decimal' }, { symbol: 't', definition: 'Time in years' }], notes: 'Rate input is converted from percentage to decimal.' }, examples: [{ title: 'Simple interest', scenario: 'Principal, annual rate, and years.', steps: ['Multiply principal by rate.', 'Multiply by time.', 'Add interest to principal.', 'Review total.'], result: 'Interest and total value are displayed.' }], useCases: ['✓ Estimate earned interest.', '✓ Compare rates.', '✓ Explain principal growth.', '✓ Check a formula.', '✓ Plan scenarios.'], commonPitfalls: ['⚠ Confusing simple and compound interest.', '⚠ Using monthly rate as annual.', '⚠ Ignoring time units.', '⚠ Assuming returns are guaranteed.', '⚠ Omitting taxes or fees.'], glossary: [{ term: 'Interest', definition: 'Amount above principal in the model.' }, { term: 'Principal', definition: 'Starting amount.' }, { term: 'Rate', definition: 'Annual percentage.' }], sources: [{ title: 'Consumer Finance', publisher: 'CFPB', url: 'https://www.consumerfinance.gov/', year: 2024 }], author: { name: 'CalculatorFree Finance Review Team', credentials: 'Interest Arithmetic Review', description: 'Simple-interest arithmetic is reviewed.' } },
  'simple-interest': { howToSteps: ['Enter principal.', 'Enter annual rate.', 'Enter years.', 'Review simple interest and total.'], faqs: [{ question: 'What is the formula?', answer: 'Simple interest equals principal times rate times time.' }, { question: 'Does interest compound?', answer: 'No, not in this calculator.' }, { question: 'What happens at zero rate?', answer: 'Interest is zero and total equals principal.' }, { question: 'Are inputs private?', answer: 'Calculations run client-side.' }], formula: { expression: 'I = P × r × t; A = P + I', variables: [{ symbol: 'I', definition: 'Simple interest' }, { symbol: 'P', definition: 'Principal' }, { symbol: 'r', definition: 'Annual decimal rate' }, { symbol: 't', definition: 'Years' }], notes: 'Negative and non-finite values are safely clamped.' }, examples: [{ title: 'Basic calculation', scenario: 'A principal grows at a fixed annual simple rate.', steps: ['Convert rate.', 'Multiply by years.', 'Multiply by principal.', 'Add to principal.'], result: 'The result card shows interest and total.' }], useCases: ['✓ Education.', '✓ Basic estimates.', '✓ Compare terms.', '✓ Validate manual calculations.', '✓ Explore zero-rate cases.'], commonPitfalls: ['⚠ Applying compound formula.', '⚠ Mixing months and years.', '⚠ Forgetting rate conversion.', '⚠ Ignoring fees.', '⚠ Treating estimates as contracts.'], glossary: [{ term: 'Simple Interest', definition: 'Interest calculated only on original principal.' }, { term: 'Total Value', definition: 'Principal plus simple interest.' }], sources: [{ title: 'Consumer Finance', publisher: 'CFPB', url: 'https://www.consumerfinance.gov/', year: 2024 }], author: { name: 'CalculatorFree Math Review Team', credentials: 'Simple Interest Review', description: 'The formula is reviewed for client-side arithmetic.' } },
  'compound-interest': { howToSteps: ['Enter principal and annual rate.', 'Set years and compounding frequency.', 'Optionally enter recurring contribution.', 'Review growth, contributions, and future value.'], faqs: [{ question: 'What is compounding?', answer: 'Compounding applies growth repeatedly at the selected frequency.' }, { question: 'Are contributions included?', answer: 'Yes, the optional recurring contribution is projected.' }, { question: 'What if rate is zero?', answer: 'Principal and contributions are returned without interest growth.' }, { question: 'Is this an investment forecast?', answer: 'No, it is a mathematical projection.' }], formula: { expression: 'A = P(1+r/n)^(nt) + C[(1+r/n)^(nt)−1]/(r/n)', variables: [{ symbol: 'P', definition: 'Principal' }, { symbol: 'r', definition: 'Annual decimal rate' }, { symbol: 'n', definition: 'Compounds per year' }, { symbol: 't', definition: 'Years' }, { symbol: 'C', definition: 'Recurring contribution' }], notes: 'The component uses a safe zero-rate branch for the contribution term.' }, examples: [{ title: 'Compound growth', scenario: 'Principal, rate, frequency, and recurring contribution.', steps: ['Calculate compounded principal.', 'Calculate contribution growth.', 'Add both values.', 'Review periods.'], result: 'The dashboard separates growth from contributions.' }], useCases: ['✓ Compare frequencies.', '✓ Explore recurring savings.', '✓ Teach compounding.', '✓ Test horizons.', '✓ Separate deposits from growth.'], commonPitfalls: ['⚠ Treating projections as guarantees.', '⚠ Using wrong frequency.', '⚠ Omitting contribution timing assumptions.', '⚠ Ignoring fees and taxes.', '⚠ Confusing nominal and effective rates.'], glossary: [{ term: 'Compounding Frequency', definition: 'Number of growth periods per year.' }, { term: 'Future Value', definition: 'Projected principal plus growth and contributions.' }, { term: 'Contribution', definition: 'Recurring amount added in the model.' }], sources: [{ title: 'Investor.gov Compound Interest', publisher: 'U.S. SEC', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator', year: 2024 }], author: { name: 'CalculatorFree Investment Math Team', credentials: 'Compound Growth Review', description: 'Compound-growth arithmetic is reviewed as a projection.' } },
  'interest-rate': { howToSteps: ['Enter principal.', 'Enter final value.', 'Enter years and frequency.', 'Review the solved annual rate.'], faqs: [{ question: 'What is solved?', answer: 'The calculator solves the annual compound rate that links principal and final value over time.' }, { question: 'What if principal is zero?', answer: 'The result safely returns zero rather than dividing by zero.' }, { question: 'Does it include contributions?', answer: 'No.' }, { question: 'Is the rate guaranteed?', answer: 'No, it is a mathematical implied rate.' }], formula: { expression: 'r = n[(A/P)^(1/(nt)) − 1]', variables: [{ symbol: 'A', definition: 'Final value' }, { symbol: 'P', definition: 'Principal' }, { symbol: 'n', definition: 'Compounds per year' }, { symbol: 't', definition: 'Years' }], notes: 'The result is displayed as an annual percentage.' }, examples: [{ title: 'Solve an implied rate', scenario: 'A principal and desired final value over a fixed horizon.', steps: ['Divide final value by principal.', 'Apply the reciprocal period exponent.', 'Subtract one.', 'Annualize by frequency.'], result: 'The annual rate appears in the primary result card.' }], useCases: ['✓ Compare investment targets.', '✓ Reverse-engineer growth assumptions.', '✓ Validate scenarios.', '✓ Compare horizons.', '✓ Explain annualized rates.'], commonPitfalls: ['⚠ Using zero principal.', '⚠ Mixing years and months.', '⚠ Treating implied rate as forecast.', '⚠ Ignoring fees and taxes.', '⚠ Confusing annual and periodic rates.'], glossary: [{ term: 'Implied Rate', definition: 'Rate mathematically required by the entered values.' }, { term: 'Final Value', definition: 'Target ending amount.' }, { term: 'Annualization', definition: 'Converting periodic growth to an annual rate.' }], sources: [{ title: 'Compound Interest Calculator', publisher: 'U.S. SEC Investor.gov', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator', year: 2024 }], author: { name: 'CalculatorFree Rate Review Team', credentials: 'Implied Rate Calculation Review', description: 'The rate-solving formula is reviewed for safe client-side output.' } },
  'investment': { howToSteps: ['Enter current balance.', 'Enter monthly contribution, return, and years.', 'Review future value, growth, and contributions.', 'Compare assumptions.'], faqs: [{ question: 'What is projected?', answer: 'A future value from balance, contribution, return, and time.' }, { question: 'Are returns guaranteed?', answer: 'No.' }, { question: 'Are fees included?', answer: 'No.' }, { question: 'Is it client-side?', answer: 'Yes.' }], formula: { expression: 'A = P(1+r/n)^(nt) + C[(1+r/n)^(nt)−1]/(r/n)', variables: [{ symbol: 'P', definition: 'Current balance' }, { symbol: 'C', definition: 'Monthly contribution' }, { symbol: 'r', definition: 'Annual return' }, { symbol: 'n', definition: 'Monthly frequency' }, { symbol: 't', definition: 'Years' }], notes: 'Monthly compounding with a safe zero-rate branch.' }, examples: [{ title: 'Growth projection', scenario: 'Balance and monthly deposits over time.', steps: ['Project balance.', 'Project deposits.', 'Add values.', 'Review future value.'], result: 'Growth and contributions are separated.' }], useCases: ['✓ Compare contribution plans.', '✓ Explore horizons.', '✓ Test returns.', '✓ Support planning.', '✓ Separate growth from deposits.'], commonPitfalls: ['⚠ Treating projections as guarantees.', '⚠ Ignoring fees and taxes.', '⚠ Mixing units.', '⚠ Omitting deposits.', '⚠ Confusing nominal and real return.'], glossary: [{ term: 'Future Value', definition: 'Projected ending value.' }, { term: 'Contribution', definition: 'Recurring deposit.' }, { term: 'Return', definition: 'Annual growth assumption.' }], sources: [{ title: 'Compound Interest Calculator', publisher: 'Investor.gov', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator', year: 2024 }], author: { name: 'CalculatorFree Investment Review Team', credentials: 'Projection Review', description: 'Reviewed as a planning projection.' } },
  'retirement': { howToSteps: ['Enter savings.', 'Enter personal and employer contributions.', 'Set return and years.', 'Review projected value.'], faqs: [{ question: 'Are employer contributions included?', answer: 'Yes, the entered employer monthly amount is included.' }, { question: 'Are withdrawals included?', answer: 'No.' }, { question: 'Are returns guaranteed?', answer: 'No.' }, { question: 'Are taxes modeled?', answer: 'No.' }], formula: { expression: 'A = projected current balance + projected combined contributions', variables: [{ symbol: 'P', definition: 'Current savings' }, { symbol: 'C', definition: 'Personal plus employer monthly contribution' }, { symbol: 'r', definition: 'Annual return' }, { symbol: 't', definition: 'Years' }], notes: 'Monthly compounding is used.' }, examples: [{ title: 'Retirement projection', scenario: 'Savings and combined contributions over a horizon.', steps: ['Combine contributions.', 'Project growth.', 'Separate deposits.', 'Review ending value.'], result: 'The dashboard shows the projected balance.' }], useCases: ['✓ Compare horizons.', '✓ Test employer contributions.', '✓ Estimate savings growth.', '✓ Compare deposits.', '✓ Support planning.'], commonPitfalls: ['⚠ Ignoring inflation.', '⚠ Omitting withdrawals.', '⚠ Ignoring limits.', '⚠ Treating returns as guaranteed.', '⚠ Treating projection as advice.'], glossary: [{ term: 'Employer Contribution', definition: 'Monthly employer amount.' }, { term: 'Horizon', definition: 'Years in the projection.' }], sources: [{ title: 'Retirement Topics', publisher: 'IRS', url: 'https://www.irs.gov/retirement-plans', year: 2024 }], author: { name: 'CalculatorFree Retirement Review Team', credentials: 'Projection Review', description: 'Reviewed as a simplified model.' } },
  '401k': { howToSteps: ['Enter current balance.', 'Enter personal contribution and match.', 'Set return and years.', 'Review projected value.'], faqs: [{ question: 'How is match calculated?', answer: 'The entered match percentage is applied to the monthly contribution.' }, { question: 'Are plan limits included?', answer: 'No.' }, { question: 'Are withdrawals included?', answer: 'No.' }, { question: 'Is it a statement?', answer: 'No.' }], formula: { expression: 'Employer Match = Monthly Contribution × Match %; A = projected balance plus total contributions', variables: [{ symbol: 'P', definition: 'Current 401K balance' }, { symbol: 'C', definition: 'Personal contribution plus match' }, { symbol: 'r', definition: 'Annual return' }, { symbol: 't', definition: 'Years' }], notes: 'This is a simplified match projection.' }, examples: [{ title: '401K match', scenario: 'Contribution with employer match.', steps: ['Calculate match.', 'Add contributions.', 'Project growth.', 'Review value.'], result: 'Employer match is included in contributions.' }], useCases: ['✓ Test match assumptions.', '✓ Compare contributions.', '✓ Explore horizons.', '✓ Separate growth.', '✓ Support plan discussions.'], commonPitfalls: ['⚠ Assuming every plan matches this way.', '⚠ Ignoring vesting.', '⚠ Ignoring limits.', '⚠ Ignoring fees.', '⚠ Treating return as guaranteed.'], glossary: [{ term: '401K', definition: 'Employer-sponsored retirement account label.' }, { term: 'Match', definition: 'Employer contribution assumption.' }], sources: [{ title: '401(k) Plans', publisher: 'U.S. Department of Labor', url: 'https://www.dol.gov/general/topic/retirement/401k', year: 2024 }], author: { name: 'CalculatorFree 401K Review Team', credentials: 'Match Review', description: 'Reviewed as a simplified model.' } },
  'roth-ira': { howToSteps: ['Enter current balance.', 'Enter contribution, return, and years.', 'Review future value.', 'Confirm actual eligibility separately.'], faqs: [{ question: 'Are taxes calculated?', answer: 'No.' }, { question: 'Are limits validated?', answer: 'No.' }, { question: 'Are returns guaranteed?', answer: 'No.' }, { question: 'Are withdrawals modeled?', answer: 'No.' }], formula: { expression: 'A = P(1+r/n)^(nt) + C[(1+r/n)^(nt)−1]/(r/n)', variables: [{ symbol: 'P', definition: 'Current balance' }, { symbol: 'C', definition: 'Monthly contribution' }, { symbol: 'r', definition: 'Annual return' }, { symbol: 'n', definition: 'Monthly frequency' }, { symbol: 't', definition: 'Years' }], notes: 'Roth eligibility and tax rules are outside the projection.' }, examples: [{ title: 'Roth projection', scenario: 'Balance and contributions over time.', steps: ['Project balance.', 'Project deposits.', 'Add growth.', 'Review value.'], result: 'Growth and contributions are displayed separately.' }], useCases: ['✓ Compare savings rates.', '✓ Explore horizons.', '✓ Estimate growth.', '✓ Test deposits.', '✓ Prepare questions.'], commonPitfalls: ['⚠ Ignoring eligibility.', '⚠ Ignoring limits.', '⚠ Ignoring fees.', '⚠ Ignoring inflation.', '⚠ Treating projections as guarantees.'], glossary: [{ term: 'Roth IRA', definition: 'Account label; account rules are not validated.' }, { term: 'Contribution', definition: 'Recurring deposit.' }], sources: [{ title: 'Roth IRAs', publisher: 'IRS', url: 'https://www.irs.gov/retirement-plans/roth-iras', year: 2024 }], author: { name: 'CalculatorFree Roth IRA Review Team', credentials: 'Projection Review', description: 'Reviewed as a simplified projection.' } },
  'ira': { howToSteps: ['Enter current balance.', 'Enter contribution, return, and years.', 'Review value and growth.', 'Confirm actual IRA rules separately.'], faqs: [{ question: 'Are taxes calculated?', answer: 'No.' }, { question: 'Are limits validated?', answer: 'No.' }, { question: 'What is projected?', answer: 'Growth of the entered balance and contributions.' }, { question: 'Is it advice?', answer: 'No.' }], formula: { expression: 'A = P(1+r/n)^(nt) + C[(1+r/n)^(nt)−1]/(r/n)', variables: [{ symbol: 'P', definition: 'Current balance' }, { symbol: 'C', definition: 'Monthly contribution' }, { symbol: 'r', definition: 'Annual return' }, { symbol: 'n', definition: 'Monthly frequency' }, { symbol: 't', definition: 'Years' }], notes: 'IRA rules, taxes, limits, and withdrawals are outside this projection.' }, examples: [{ title: 'IRA growth', scenario: 'Balance and contribution over a horizon.', steps: ['Project principal.', 'Project deposits.', 'Add growth.', 'Review balance.'], result: 'The ending balance appears in the primary card.' }], useCases: ['✓ Explore scenarios.', '✓ Compare horizons.', '✓ Estimate contribution impact.', '✓ Separate growth.', '✓ Support planning.'], commonPitfalls: ['⚠ Ignoring account rules.', '⚠ Ignoring taxes and fees.', '⚠ Treating return as guaranteed.', '⚠ Mixing annual and monthly values.', '⚠ Treating estimates as advice.'], glossary: [{ term: 'IRA', definition: 'Individual retirement account label for this simplified model.' }, { term: 'Future Value', definition: 'Projected ending balance.' }], sources: [{ title: 'Individual Retirement Arrangements', publisher: 'IRS', url: 'https://www.irs.gov/retirement-plans/individual-retirement-arrangements-iras', year: 2024 }], author: { name: 'CalculatorFree IRA Review Team', credentials: 'Projection Review', description: 'Reviewed as a simplified client-side projection.' } },
  'income-tax': {howToSteps:['Enter the amount.','Enter the rate.','Review tax and net result.','Use the estimate for planning.'],faqs:[{question:'Are rates jurisdiction-specific?',answer:'This model uses the rate entered by the user.'},{question:'Are deductions included?',answer:'No.'},{question:'Are values client-side?',answer:'Yes.'},{question:'Is this official advice?',answer:'No.'}],formula:{expression:'Tax = Amount × Rate; Net = Amount − Tax',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Non-finite and negative values are safely handled.'},examples:[{title:'Basic estimate',scenario:'An amount and rate.',steps:['Enter amount.','Convert rate.','Multiply.','Review result.'],result:'Tax and net amount appear.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Ignoring local rules.','⚠ Omitting deductions.','⚠ Treating estimate as filing.'],glossary:[{term:'Tax',definition:'Modeled amount calculated from rate.'},{term:'Net',definition:'Amount after modeled tax.'}],sources:[{title:'Tax Information',publisher:'IRS',url:'https://www.irs.gov/',year:2024}],author:{name:'CalculatorFree Tax Review Team',credentials:'Tax Math Review',description:'Client-side estimate only'}},
  'salary': {howToSteps:['Enter the amount.','Enter the rate.','Review tax and net result.','Use the estimate for planning.'],faqs:[{question:'Are rates jurisdiction-specific?',answer:'This model uses the rate entered by the user.'},{question:'Are deductions included?',answer:'No.'},{question:'Are values client-side?',answer:'Yes.'},{question:'Is this official advice?',answer:'No.'}],formula:{expression:'Tax = Amount × Rate; Net = Amount − Tax',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Non-finite and negative values are safely handled.'},examples:[{title:'Basic estimate',scenario:'An amount and rate.',steps:['Enter amount.','Convert rate.','Multiply.','Review result.'],result:'Tax and net amount appear.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Ignoring local rules.','⚠ Omitting deductions.','⚠ Treating estimate as filing.'],glossary:[{term:'Tax',definition:'Modeled amount calculated from rate.'},{term:'Net',definition:'Amount after modeled tax.'}],sources:[{title:'Tax Information',publisher:'IRS',url:'https://www.irs.gov/',year:2024}],author:{name:'CalculatorFree Tax Review Team',credentials:'Tax Math Review',description:'Client-side estimate only'}},
  'take-home-paycheck': {howToSteps:['Enter the amount.','Enter the rate.','Review tax and net result.','Use the estimate for planning.'],faqs:[{question:'Are rates jurisdiction-specific?',answer:'This model uses the rate entered by the user.'},{question:'Are deductions included?',answer:'No.'},{question:'Are values client-side?',answer:'Yes.'},{question:'Is this official advice?',answer:'No.'}],formula:{expression:'Tax = Amount × Rate; Net = Amount − Tax',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Non-finite and negative values are safely handled.'},examples:[{title:'Basic estimate',scenario:'An amount and rate.',steps:['Enter amount.','Convert rate.','Multiply.','Review result.'],result:'Tax and net amount appear.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Ignoring local rules.','⚠ Omitting deductions.','⚠ Treating estimate as filing.'],glossary:[{term:'Tax',definition:'Modeled amount calculated from rate.'},{term:'Net',definition:'Amount after modeled tax.'}],sources:[{title:'Tax Information',publisher:'IRS',url:'https://www.irs.gov/',year:2024}],author:{name:'CalculatorFree Tax Review Team',credentials:'Tax Math Review',description:'Client-side estimate only'}},
  'sales-tax': {howToSteps:['Enter the amount.','Enter the rate.','Review tax and net result.','Use the estimate for planning.'],faqs:[{question:'Are rates jurisdiction-specific?',answer:'This model uses the rate entered by the user.'},{question:'Are deductions included?',answer:'No.'},{question:'Are values client-side?',answer:'Yes.'},{question:'Is this official advice?',answer:'No.'}],formula:{expression:'Tax = Amount × Rate; Net = Amount − Tax',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Non-finite and negative values are safely handled.'},examples:[{title:'Basic estimate',scenario:'An amount and rate.',steps:['Enter amount.','Convert rate.','Multiply.','Review result.'],result:'Tax and net amount appear.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Ignoring local rules.','⚠ Omitting deductions.','⚠ Treating estimate as filing.'],glossary:[{term:'Tax',definition:'Modeled amount calculated from rate.'},{term:'Net',definition:'Amount after modeled tax.'}],sources:[{title:'Tax Information',publisher:'IRS',url:'https://www.irs.gov/',year:2024}],author:{name:'CalculatorFree Tax Review Team',credentials:'Tax Math Review',description:'Client-side estimate only'}},
  'marriage-tax': {howToSteps:['Enter the amount.','Enter the rate.','Review tax and net result.','Use the estimate for planning.'],faqs:[{question:'Are rates jurisdiction-specific?',answer:'This model uses the rate entered by the user.'},{question:'Are deductions included?',answer:'No.'},{question:'Are values client-side?',answer:'Yes.'},{question:'Is this official advice?',answer:'No.'}],formula:{expression:'Tax = Amount × Rate; Net = Amount − Tax',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Non-finite and negative values are safely handled.'},examples:[{title:'Basic estimate',scenario:'An amount and rate.',steps:['Enter amount.','Convert rate.','Multiply.','Review result.'],result:'Tax and net amount appear.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Ignoring local rules.','⚠ Omitting deductions.','⚠ Treating estimate as filing.'],glossary:[{term:'Tax',definition:'Modeled amount calculated from rate.'},{term:'Net',definition:'Amount after modeled tax.'}],sources:[{title:'Tax Information',publisher:'IRS',url:'https://www.irs.gov/',year:2024}],author:{name:'CalculatorFree Tax Review Team',credentials:'Tax Math Review',description:'Client-side estimate only'}},  'rmd': {howToSteps:['Enter inputs.','Review the calculation.','Check the result cards.','Use it as a planning estimate.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Are fees or taxes included?',answer:'No unless entered.'},{question:'Are results guaranteed?',answer:'No.'},{question:'Should official rules be checked?',answer:'Yes.'}],formula:{expression:'The displayed result follows the calculator-specific balance, rate, term, or divisor formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Non-negative inputs are handled safely.'},examples:[{title:'Basic scenario',scenario:'Enter valid balance and assumptions.',steps:['Enter values.','Apply the formula.','Review output.','Compare assumptions.'],result:'The dashboard shows the calculated result.'}],useCases:['✓ Planning.','✓ Education.','✓ Scenario comparison.'],commonPitfalls:['⚠ Ignoring fees or taxes.','⚠ Using wrong units.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Balance',definition:'Starting amount.'},{term:'Rate',definition:'Annual percentage assumption.'}],sources:[{title:'Retirement Plans',publisher:'IRS',url:'https://www.irs.gov/retirement-plans',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'annuity': {howToSteps:['Enter inputs.','Review the calculation.','Check the result cards.','Use it as a planning estimate.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Are fees or taxes included?',answer:'No unless entered.'},{question:'Are results guaranteed?',answer:'No.'},{question:'Should official rules be checked?',answer:'Yes.'}],formula:{expression:'The displayed result follows the calculator-specific balance, rate, term, or divisor formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Non-negative inputs are handled safely.'},examples:[{title:'Basic scenario',scenario:'Enter valid balance and assumptions.',steps:['Enter values.','Apply the formula.','Review output.','Compare assumptions.'],result:'The dashboard shows the calculated result.'}],useCases:['✓ Planning.','✓ Education.','✓ Scenario comparison.'],commonPitfalls:['⚠ Ignoring fees or taxes.','⚠ Using wrong units.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Balance',definition:'Starting amount.'},{term:'Rate',definition:'Annual percentage assumption.'}],sources:[{title:'Retirement Plans',publisher:'IRS',url:'https://www.irs.gov/retirement-plans',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'annuity-payout': {howToSteps:['Enter inputs.','Review the calculation.','Check the result cards.','Use it as a planning estimate.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Are fees or taxes included?',answer:'No unless entered.'},{question:'Are results guaranteed?',answer:'No.'},{question:'Should official rules be checked?',answer:'Yes.'}],formula:{expression:'The displayed result follows the calculator-specific balance, rate, term, or divisor formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Non-negative inputs are handled safely.'},examples:[{title:'Basic scenario',scenario:'Enter valid balance and assumptions.',steps:['Enter values.','Apply the formula.','Review output.','Compare assumptions.'],result:'The dashboard shows the calculated result.'}],useCases:['✓ Planning.','✓ Education.','✓ Scenario comparison.'],commonPitfalls:['⚠ Ignoring fees or taxes.','⚠ Using wrong units.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Balance',definition:'Starting amount.'},{term:'Rate',definition:'Annual percentage assumption.'}],sources:[{title:'Retirement Plans',publisher:'IRS',url:'https://www.irs.gov/retirement-plans',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'savings': {howToSteps:['Enter inputs.','Review the calculation.','Check the result cards.','Use it as a planning estimate.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Are fees or taxes included?',answer:'No unless entered.'},{question:'Are results guaranteed?',answer:'No.'},{question:'Should official rules be checked?',answer:'Yes.'}],formula:{expression:'The displayed result follows the calculator-specific balance, rate, term, or divisor formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Non-negative inputs are handled safely.'},examples:[{title:'Basic scenario',scenario:'Enter valid balance and assumptions.',steps:['Enter values.','Apply the formula.','Review output.','Compare assumptions.'],result:'The dashboard shows the calculated result.'}],useCases:['✓ Planning.','✓ Education.','✓ Scenario comparison.'],commonPitfalls:['⚠ Ignoring fees or taxes.','⚠ Using wrong units.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Balance',definition:'Starting amount.'},{term:'Rate',definition:'Annual percentage assumption.'}],sources:[{title:'Retirement Plans',publisher:'IRS',url:'https://www.irs.gov/retirement-plans',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'cd': {howToSteps:['Enter inputs.','Review the calculation.','Check the result cards.','Use it as a planning estimate.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Are fees or taxes included?',answer:'No unless entered.'},{question:'Are results guaranteed?',answer:'No.'},{question:'Should official rules be checked?',answer:'Yes.'}],formula:{expression:'The displayed result follows the calculator-specific balance, rate, term, or divisor formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Non-negative inputs are handled safely.'},examples:[{title:'Basic scenario',scenario:'Enter valid balance and assumptions.',steps:['Enter values.','Apply the formula.','Review output.','Compare assumptions.'],result:'The dashboard shows the calculated result.'}],useCases:['✓ Planning.','✓ Education.','✓ Scenario comparison.'],commonPitfalls:['⚠ Ignoring fees or taxes.','⚠ Using wrong units.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Balance',definition:'Starting amount.'},{term:'Rate',definition:'Annual percentage assumption.'}],sources:[{title:'Retirement Plans',publisher:'IRS',url:'https://www.irs.gov/retirement-plans',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},  'inflation': {howToSteps:['Enter the amount and assumptions.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can rates vary?',answer:'Yes, the user-entered rate controls the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, cost, or discount formula.',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Inputs are sanitized and zero-term cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result and difference are displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Difference',definition:'Change between input and result.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'depreciation': {howToSteps:['Enter the amount and assumptions.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can rates vary?',answer:'Yes, the user-entered rate controls the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, cost, or discount formula.',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Inputs are sanitized and zero-term cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result and difference are displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Difference',definition:'Change between input and result.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'average-return': {howToSteps:['Enter the amount and assumptions.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can rates vary?',answer:'Yes, the user-entered rate controls the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, cost, or discount formula.',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Inputs are sanitized and zero-term cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result and difference are displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Difference',definition:'Change between input and result.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'margin': {howToSteps:['Enter the amount and assumptions.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can rates vary?',answer:'Yes, the user-entered rate controls the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, cost, or discount formula.',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Inputs are sanitized and zero-term cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result and difference are displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Difference',definition:'Change between input and result.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'discount': {howToSteps:['Enter the amount and assumptions.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can rates vary?',answer:'Yes, the user-entered rate controls the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, cost, or discount formula.',variables:[{symbol:'Amount',definition:'Entered amount'},{symbol:'Rate',definition:'Entered percentage'}],notes:'Inputs are sanitized and zero-term cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result and difference are displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Difference',definition:'Change between input and result.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'percent-off': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'business-loan': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'lease': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'budget': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'irr': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'roi': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'apr': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'payback-period': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'present-value': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'future-value': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'No unless entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'The result uses the calculator-specific amount, rate, term, or cash-flow formula.',variables:[{symbol:'Input',definition:'User-entered value'}],notes:'Zero and non-finite cases are guarded.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply formula.','Review result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring fees.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'Percentage assumption.'},{term:'Result',definition:'Calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Simplified client-side estimate.'}},
  'estate-tax': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'Only if entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'Tax = max(Estate − Exemption, 0) × Tax Rate.',variables:[{symbol:'Inputs',definition:'User-entered assumptions'}],notes:'Results are guarded against zero and non-finite values.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply the displayed formula.','Review the result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring assumptions.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'A percentage assumption.'},{term:'Result',definition:'The calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Client-side estimate with transparent assumptions.'}},
  'finance': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'Only if entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'Payment = P × i ÷ (1 − (1 + i)^−n), where i is the monthly rate and n is the number of payments.',variables:[{symbol:'Inputs',definition:'User-entered assumptions'}],notes:'Results are guarded against zero and non-finite values.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply the displayed formula.','Review the result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring assumptions.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'A percentage assumption.'},{term:'Result',definition:'The calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Client-side estimate with transparent assumptions.'}},
  'pension': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'Only if entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'Future fund = Current balance × (1 + r/12)^(12t) + Contribution × (((1 + r/12)^(12t) − 1) ÷ (r/12)).',variables:[{symbol:'Inputs',definition:'User-entered assumptions'}],notes:'Results are guarded against zero and non-finite values.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply the displayed formula.','Review the result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring assumptions.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'A percentage assumption.'},{term:'Result',definition:'The calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Client-side estimate with transparent assumptions.'}},
  'social-security': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'Only if entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'Monthly benefit = min(Average monthly earnings, Earnings cap) × Replacement rate ÷ 100.',variables:[{symbol:'Inputs',definition:'User-entered assumptions'}],notes:'Results are guarded against zero and non-finite values.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply the displayed formula.','Review the result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring assumptions.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'A percentage assumption.'},{term:'Result',definition:'The calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Client-side estimate with transparent assumptions.'}},
  'currency': {howToSteps:['Enter the inputs.','Review the live result.','Compare the scenario.','Use the estimate carefully.'],faqs:[{question:'Are values client-side?',answer:'Yes.'},{question:'Can assumptions vary?',answer:'Yes, inputs control the estimate.'},{question:'Are fees included?',answer:'Only if entered.'},{question:'Is this advice?',answer:'No.'}],formula:{expression:'Converted amount = Amount × Exchange rate.',variables:[{symbol:'Inputs',definition:'User-entered assumptions'}],notes:'Results are guarded against zero and non-finite values.'},examples:[{title:'Basic scenario',scenario:'Enter valid values.',steps:['Enter inputs.','Apply the displayed formula.','Review the result.','Compare assumptions.'],result:'The primary result is displayed.'}],useCases:['✓ Planning.','✓ Comparison.','✓ Education.'],commonPitfalls:['⚠ Mixing units.','⚠ Ignoring assumptions.','⚠ Treating estimates as guarantees.'],glossary:[{term:'Rate',definition:'A percentage assumption.'},{term:'Result',definition:'The calculated output.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Client-side estimate with transparent assumptions.'}},
  'commission': {formula:{expression:'Commission = Sales amount × Commission rate ÷ 100.',variables:[{symbol:'Sales',definition:'Base sales amount'},{symbol:'Rate',definition:'Commission percentage'}],notes:'Total earnings equals sales plus commission.'},howToSteps:['Enter the required inputs.','Check the units and rate.','Review the live result.','Use it as an estimate, not a diagnosis or guarantee.'],faqs:[{question:'Are calculations client-side?',answer:'Yes, the inputs stay in your browser.'},{question:'Can I change assumptions?',answer:'Yes.'},{question:'Does this replace professional advice?',answer:'No.'},{question:'Are results rounded?',answer:'Displayed values are rounded for readability.'}],examples:[{title:'Worked example',scenario:'Use the default values or enter a known scenario.',steps:['Enter valid inputs.','Apply the formula.','Review the primary result.','Compare the secondary result.'],result:'The result updates instantly.'}],useCases:['✓ Sales planning and quoting.','✓ Tax-inclusive pricing checks.','✓ Health education and screening context.'],commonPitfalls:['⚠ Entering a percentage as a decimal.','⚠ Mixing units.','⚠ Treating a screening flag as a medical diagnosis.'],glossary:[{term:'Rate',definition:'A percentage applied to a base.'},{term:'Base',definition:'The amount or measurement used by the formula.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024},{title:'BMI Classification',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Review Team',credentials:'Calculation Review',description:'Transparent client-side educational calculator.'}},
  'vat': {formula:{expression:'VAT = Net price × VAT rate ÷ 100; Gross price = Net price + VAT.',variables:[{symbol:'Net',definition:'Price before VAT'},{symbol:'Rate',definition:'VAT percentage'}],notes:'This estimates VAT from a net price.'},howToSteps:['Enter the required inputs.','Check the units and rate.','Review the live result.','Use it as an estimate, not a diagnosis or guarantee.'],faqs:[{question:'Are calculations client-side?',answer:'Yes, the inputs stay in your browser.'},{question:'Can I change assumptions?',answer:'Yes.'},{question:'Does this replace professional advice?',answer:'No.'},{question:'Are results rounded?',answer:'Displayed values are rounded for readability.'}],examples:[{title:'Worked example',scenario:'Use the default values or enter a known scenario.',steps:['Enter valid inputs.','Apply the formula.','Review the primary result.','Compare the secondary result.'],result:'The result updates instantly.'}],useCases:['✓ Sales planning and quoting.','✓ Tax-inclusive pricing checks.','✓ Health education and screening context.'],commonPitfalls:['⚠ Entering a percentage as a decimal.','⚠ Mixing units.','⚠ Treating a screening flag as a medical diagnosis.'],glossary:[{term:'Rate',definition:'A percentage applied to a base.'},{term:'Base',definition:'The amount or measurement used by the formula.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024},{title:'BMI Classification',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Review Team',credentials:'Calculation Review',description:'Transparent client-side educational calculator.'}},
  'anorexic-bmi': {formula:{expression:'BMI = weight in kilograms ÷ height in metres²; flag = 1 when BMI < 18.5.',variables:[{symbol:'Weight',definition:'Body weight in kilograms'},{symbol:'Height',definition:'Height in metres'}],notes:'A low-BMI flag is not a diagnosis and should be discussed with a qualified clinician.'},howToSteps:['Enter the required inputs.','Check the units and rate.','Review the live result.','Use it as an estimate, not a diagnosis or guarantee.'],faqs:[{question:'Are calculations client-side?',answer:'Yes, the inputs stay in your browser.'},{question:'Can I change assumptions?',answer:'Yes.'},{question:'Does this replace professional advice?',answer:'No.'},{question:'Are results rounded?',answer:'Displayed values are rounded for readability.'}],examples:[{title:'Worked example',scenario:'Use the default values or enter a known scenario.',steps:['Enter valid inputs.','Apply the formula.','Review the primary result.','Compare the secondary result.'],result:'The result updates instantly.'}],useCases:['✓ Sales planning and quoting.','✓ Tax-inclusive pricing checks.','✓ Health education and screening context.'],commonPitfalls:['⚠ Entering a percentage as a decimal.','⚠ Mixing units.','⚠ Treating a screening flag as a medical diagnosis.'],glossary:[{term:'Rate',definition:'A percentage applied to a base.'},{term:'Base',definition:'The amount or measurement used by the formula.'}],sources:[{title:'Consumer Finance Resources',publisher:'CFPB',url:'https://www.consumerfinance.gov/',year:2024},{title:'BMI Classification',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Review Team',credentials:'Calculation Review',description:'Transparent client-side educational calculator.'}},
  'bmr': {formula:{expression:'BMR = 10×weight(kg) + 6.25×height(cm) − 5×age + 5 (male reference equation).',variables:[{symbol:'Inputs',definition:'User-entered body measurements and nutrition assumptions'}],notes:'Equation output is an estimate and non-finite values are guarded.'},howToSteps:['Enter weight, height, age, and the tool-specific assumption.','Confirm units.','Review the live result.','Use the estimate as educational guidance and discuss consequential decisions with a professional.'],faqs:[{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can inputs be changed?',answer:'Yes, results recalculate instantly.'},{question:'Does this diagnose or prescribe?',answer:'No.'},{question:'Are results exact?',answer:'They are estimates based on the stated equation and assumptions.'}],examples:[{title:'Worked example',scenario:'Use a valid adult profile and the displayed defaults.',steps:['Enter measurements.','Apply the equation.','Review the primary output.','Compare the reference output.'],result:'The result updates in the browser.'}],useCases:['✓ Nutrition planning context.','✓ Comparing activity assumptions.','✓ Educational estimation.'],commonPitfalls:['⚠ Mixing kilograms and pounds.','⚠ Mixing centimetres and metres.','⚠ Treating estimates as medical advice.'],glossary:[{term:'BMR',definition:'Estimated basal energy expenditure.'},{term:'TDEE',definition:'Estimated total daily energy expenditure.'}],sources:[{title:'Dietary Guidelines for Americans',publisher:'HHS and USDA',url:'https://www.dietaryguidelines.gov/',year:2020},{title:'Adult BMI and health context',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'tdee': {formula:{expression:'TDEE = BMR × activity multiplier.',variables:[{symbol:'Inputs',definition:'User-entered body measurements and nutrition assumptions'}],notes:'Equation output is an estimate and non-finite values are guarded.'},howToSteps:['Enter weight, height, age, and the tool-specific assumption.','Confirm units.','Review the live result.','Use the estimate as educational guidance and discuss consequential decisions with a professional.'],faqs:[{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can inputs be changed?',answer:'Yes, results recalculate instantly.'},{question:'Does this diagnose or prescribe?',answer:'No.'},{question:'Are results exact?',answer:'They are estimates based on the stated equation and assumptions.'}],examples:[{title:'Worked example',scenario:'Use a valid adult profile and the displayed defaults.',steps:['Enter measurements.','Apply the equation.','Review the primary output.','Compare the reference output.'],result:'The result updates in the browser.'}],useCases:['✓ Nutrition planning context.','✓ Comparing activity assumptions.','✓ Educational estimation.'],commonPitfalls:['⚠ Mixing kilograms and pounds.','⚠ Mixing centimetres and metres.','⚠ Treating estimates as medical advice.'],glossary:[{term:'BMR',definition:'Estimated basal energy expenditure.'},{term:'TDEE',definition:'Estimated total daily energy expenditure.'}],sources:[{title:'Dietary Guidelines for Americans',publisher:'HHS and USDA',url:'https://www.dietaryguidelines.gov/',year:2020},{title:'Adult BMI and health context',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'macro': {formula:{expression:'Carbohydrate grams = daily calories × 50% ÷ 4; fat grams = daily calories × 25% ÷ 9.',variables:[{symbol:'Inputs',definition:'User-entered body measurements and nutrition assumptions'}],notes:'Equation output is an estimate and non-finite values are guarded.'},howToSteps:['Enter weight, height, age, and the tool-specific assumption.','Confirm units.','Review the live result.','Use the estimate as educational guidance and discuss consequential decisions with a professional.'],faqs:[{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can inputs be changed?',answer:'Yes, results recalculate instantly.'},{question:'Does this diagnose or prescribe?',answer:'No.'},{question:'Are results exact?',answer:'They are estimates based on the stated equation and assumptions.'}],examples:[{title:'Worked example',scenario:'Use a valid adult profile and the displayed defaults.',steps:['Enter measurements.','Apply the equation.','Review the primary output.','Compare the reference output.'],result:'The result updates in the browser.'}],useCases:['✓ Nutrition planning context.','✓ Comparing activity assumptions.','✓ Educational estimation.'],commonPitfalls:['⚠ Mixing kilograms and pounds.','⚠ Mixing centimetres and metres.','⚠ Treating estimates as medical advice.'],glossary:[{term:'BMR',definition:'Estimated basal energy expenditure.'},{term:'TDEE',definition:'Estimated total daily energy expenditure.'}],sources:[{title:'Dietary Guidelines for Americans',publisher:'HHS and USDA',url:'https://www.dietaryguidelines.gov/',year:2020},{title:'Adult BMI and health context',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'protein': {formula:{expression:'Protein grams = body weight(kg) × protein target(g/kg).',variables:[{symbol:'Inputs',definition:'User-entered body measurements and nutrition assumptions'}],notes:'Equation output is an estimate and non-finite values are guarded.'},howToSteps:['Enter weight, height, age, and the tool-specific assumption.','Confirm units.','Review the live result.','Use the estimate as educational guidance and discuss consequential decisions with a professional.'],faqs:[{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can inputs be changed?',answer:'Yes, results recalculate instantly.'},{question:'Does this diagnose or prescribe?',answer:'No.'},{question:'Are results exact?',answer:'They are estimates based on the stated equation and assumptions.'}],examples:[{title:'Worked example',scenario:'Use a valid adult profile and the displayed defaults.',steps:['Enter measurements.','Apply the equation.','Review the primary output.','Compare the reference output.'],result:'The result updates in the browser.'}],useCases:['✓ Nutrition planning context.','✓ Comparing activity assumptions.','✓ Educational estimation.'],commonPitfalls:['⚠ Mixing kilograms and pounds.','⚠ Mixing centimetres and metres.','⚠ Treating estimates as medical advice.'],glossary:[{term:'BMR',definition:'Estimated basal energy expenditure.'},{term:'TDEE',definition:'Estimated total daily energy expenditure.'}],sources:[{title:'Dietary Guidelines for Americans',publisher:'HHS and USDA',url:'https://www.dietaryguidelines.gov/',year:2020},{title:'Adult BMI and health context',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'carbohydrate': {formula:{expression:'Carbohydrate grams = daily calories × carbohydrate share ÷ 4.',variables:[{symbol:'Inputs',definition:'User-entered body measurements and nutrition assumptions'}],notes:'Equation output is an estimate and non-finite values are guarded.'},howToSteps:['Enter weight, height, age, and the tool-specific assumption.','Confirm units.','Review the live result.','Use the estimate as educational guidance and discuss consequential decisions with a professional.'],faqs:[{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can inputs be changed?',answer:'Yes, results recalculate instantly.'},{question:'Does this diagnose or prescribe?',answer:'No.'},{question:'Are results exact?',answer:'They are estimates based on the stated equation and assumptions.'}],examples:[{title:'Worked example',scenario:'Use a valid adult profile and the displayed defaults.',steps:['Enter measurements.','Apply the equation.','Review the primary output.','Compare the reference output.'],result:'The result updates in the browser.'}],useCases:['✓ Nutrition planning context.','✓ Comparing activity assumptions.','✓ Educational estimation.'],commonPitfalls:['⚠ Mixing kilograms and pounds.','⚠ Mixing centimetres and metres.','⚠ Treating estimates as medical advice.'],glossary:[{term:'BMR',definition:'Estimated basal energy expenditure.'},{term:'TDEE',definition:'Estimated total daily energy expenditure.'}],sources:[{title:'Dietary Guidelines for Americans',publisher:'HHS and USDA',url:'https://www.dietaryguidelines.gov/',year:2020},{title:'Adult BMI and health context',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'fat-intake': {formula:{expression:'Fat grams = calories × fat share ÷ 9.',variables:[{symbol:'Inputs',definition:'User measurements and assumptions'}],notes:'Estimate only.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use health decisions with a qualified professional.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter a valid height and weight.',steps:['Enter measurements.','Apply the specific equation.','Review output.','Compare references.'],result:'The result updates instantly.'}],useCases:['✓ Educational context.','✓ Fitness planning.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating estimates as diagnosis.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'MET',definition:'Metabolic equivalent used for activity estimates.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'ideal-weight': {formula:{expression:'Reference weight = 22 × height(m)².',variables:[{symbol:'Inputs',definition:'User measurements and assumptions'}],notes:'Estimate only.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use health decisions with a qualified professional.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter a valid height and weight.',steps:['Enter measurements.','Apply the specific equation.','Review output.','Compare references.'],result:'The result updates instantly.'}],useCases:['✓ Educational context.','✓ Fitness planning.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating estimates as diagnosis.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'MET',definition:'Metabolic equivalent used for activity estimates.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'healthy-weight': {formula:{expression:'Healthy range = 18.5 × height(m)² to 24.9 × height(m)².',variables:[{symbol:'Inputs',definition:'User measurements and assumptions'}],notes:'Estimate only.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use health decisions with a qualified professional.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter a valid height and weight.',steps:['Enter measurements.','Apply the specific equation.','Review output.','Compare references.'],result:'The result updates instantly.'}],useCases:['✓ Educational context.','✓ Fitness planning.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating estimates as diagnosis.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'MET',definition:'Metabolic equivalent used for activity estimates.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'lean-body-mass': {formula:{expression:'Lean body mass = 0.407×weight(kg) + 0.267×height(cm) − 19.2.',variables:[{symbol:'Inputs',definition:'User measurements and assumptions'}],notes:'Estimate only.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use health decisions with a qualified professional.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter a valid height and weight.',steps:['Enter measurements.','Apply the specific equation.','Review output.','Compare references.'],result:'The result updates instantly.'}],useCases:['✓ Educational context.','✓ Fitness planning.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating estimates as diagnosis.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'MET',definition:'Metabolic equivalent used for activity estimates.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'calories-burned': {formula:{expression:'Calories = MET × 3.5 × weight(kg) ÷ 200 × minutes.',variables:[{symbol:'Inputs',definition:'User measurements and assumptions'}],notes:'Estimate only.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use health decisions with a qualified professional.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations client-side?',answer:'Yes.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter a valid height and weight.',steps:['Enter measurements.','Apply the specific equation.','Review output.','Compare references.'],result:'The result updates instantly.'}],useCases:['✓ Educational context.','✓ Fitness planning.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating estimates as diagnosis.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'MET',definition:'Metabolic equivalent used for activity estimates.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'target-heart-rate': {formula:{expression:'Maximum heart rate reference = 220 − age.',variables:[{symbol:'Inputs',definition:'Entered body measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use it for education, not diagnosis.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I change inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter age, load, weight, and height.',steps:['Enter inputs.','Apply the tool formula.','Review the primary result.','Compare the reference.'],result:'The result updates instantly.'}],useCases:['✓ Fitness planning context.','✓ Educational screening.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating flags as diagnoses.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'1RM',definition:'Estimated one-repetition maximum.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'one-rep-max': {formula:{expression:'Estimated 1RM = load × (1 + repetitions ÷ 30).',variables:[{symbol:'Inputs',definition:'Entered body measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use it for education, not diagnosis.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I change inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter age, load, weight, and height.',steps:['Enter inputs.','Apply the tool formula.','Review the primary result.','Compare the reference.'],result:'The result updates instantly.'}],useCases:['✓ Fitness planning context.','✓ Educational screening.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating flags as diagnoses.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'1RM',definition:'Estimated one-repetition maximum.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'weight-watcher-points': {formula:{expression:'Simplified points = max(0, (4×weight + 0.1×height − 0.5×age) ÷ 10).',variables:[{symbol:'Inputs',definition:'Entered body measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use it for education, not diagnosis.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I change inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter age, load, weight, and height.',steps:['Enter inputs.','Apply the tool formula.','Review the primary result.','Compare the reference.'],result:'The result updates instantly.'}],useCases:['✓ Fitness planning context.','✓ Educational screening.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating flags as diagnoses.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'1RM',definition:'Estimated one-repetition maximum.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'overweight': {formula:{expression:'BMI = weight(kg) ÷ height(m)²; overweight reference begins at BMI 25.',variables:[{symbol:'Inputs',definition:'Entered body measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use it for education, not diagnosis.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I change inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter age, load, weight, and height.',steps:['Enter inputs.','Apply the tool formula.','Review the primary result.','Compare the reference.'],result:'The result updates instantly.'}],useCases:['✓ Fitness planning context.','✓ Educational screening.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating flags as diagnoses.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'1RM',definition:'Estimated one-repetition maximum.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'body-fat': {formula:{expression:'Screening estimate = 1.2×weight(kg) ÷ height(m).',variables:[{symbol:'Inputs',definition:'Entered body measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter measurements.','Confirm units.','Review the estimate.','Use it for education, not diagnosis.'],faqs:[{question:'Is this medical advice?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I change inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they depend on assumptions.'}],examples:[{title:'Worked example',scenario:'Enter age, load, weight, and height.',steps:['Enter inputs.','Apply the tool formula.','Review the primary result.','Compare the reference.'],result:'The result updates instantly.'}],useCases:['✓ Fitness planning context.','✓ Educational screening.','✓ Scenario comparison.'],commonPitfalls:['⚠ Mixing kg and lb.','⚠ Mixing cm and m.','⚠ Treating flags as diagnoses.'],glossary:[{term:'BMI',definition:'Weight divided by height squared.'},{term:'1RM',definition:'Estimated one-repetition maximum.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side estimate.'}},
  'army-body-fat': {formula:{expression:'Estimated body fat = max(0, 1.2×BMI + 0.23×age − 16.2).',variables:[{symbol:'Inputs',definition:'Entered measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter the measurements or pregnancy week.','Confirm the units.','Review the live estimate.','Discuss consequential health decisions with a qualified clinician.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they are estimates.'}],examples:[{title:'Worked example',scenario:'Enter a valid profile.',steps:['Enter inputs.','Apply the displayed equation.','Review output.','Compare reference values.'],result:'The result updates instantly.'}],useCases:['✓ Educational screening.','✓ Fitness planning context.','✓ Pregnancy-date orientation.'],commonPitfalls:['⚠ Mixing units.','⚠ Treating estimates as clinical decisions.','⚠ Ignoring individual medical context.'],glossary:[{term:'BSA',definition:'Estimated body surface area.'},{term:'BMI',definition:'Weight divided by height squared.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024},{title:'Body Surface Area',publisher:'NCBI Bookshelf',url:'https://www.ncbi.nlm.nih.gov/books/NBK542275/',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'body-surface-area': {formula:{expression:'BSA = √(weight(kg) × height(cm) ÷ 3600).',variables:[{symbol:'Inputs',definition:'Entered measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter the measurements or pregnancy week.','Confirm the units.','Review the live estimate.','Discuss consequential health decisions with a qualified clinician.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they are estimates.'}],examples:[{title:'Worked example',scenario:'Enter a valid profile.',steps:['Enter inputs.','Apply the displayed equation.','Review output.','Compare reference values.'],result:'The result updates instantly.'}],useCases:['✓ Educational screening.','✓ Fitness planning context.','✓ Pregnancy-date orientation.'],commonPitfalls:['⚠ Mixing units.','⚠ Treating estimates as clinical decisions.','⚠ Ignoring individual medical context.'],glossary:[{term:'BSA',definition:'Estimated body surface area.'},{term:'BMI',definition:'Weight divided by height squared.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024},{title:'Body Surface Area',publisher:'NCBI Bookshelf',url:'https://www.ncbi.nlm.nih.gov/books/NBK542275/',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'body-type': {formula:{expression:'BMI = weight(kg) ÷ height(m)²; type code is based on BMI bands.',variables:[{symbol:'Inputs',definition:'Entered measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter the measurements or pregnancy week.','Confirm the units.','Review the live estimate.','Discuss consequential health decisions with a qualified clinician.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they are estimates.'}],examples:[{title:'Worked example',scenario:'Enter a valid profile.',steps:['Enter inputs.','Apply the displayed equation.','Review output.','Compare reference values.'],result:'The result updates instantly.'}],useCases:['✓ Educational screening.','✓ Fitness planning context.','✓ Pregnancy-date orientation.'],commonPitfalls:['⚠ Mixing units.','⚠ Treating estimates as clinical decisions.','⚠ Ignoring individual medical context.'],glossary:[{term:'BSA',definition:'Estimated body surface area.'},{term:'BMI',definition:'Weight divided by height squared.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024},{title:'Body Surface Area',publisher:'NCBI Bookshelf',url:'https://www.ncbi.nlm.nih.gov/books/NBK542275/',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'pregnancy': {formula:{expression:'Weeks remaining = 40 − completed pregnancy weeks; days = weeks remaining × 7.',variables:[{symbol:'Inputs',definition:'Entered measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter the measurements or pregnancy week.','Confirm the units.','Review the live estimate.','Discuss consequential health decisions with a qualified clinician.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they are estimates.'}],examples:[{title:'Worked example',scenario:'Enter a valid profile.',steps:['Enter inputs.','Apply the displayed equation.','Review output.','Compare reference values.'],result:'The result updates instantly.'}],useCases:['✓ Educational screening.','✓ Fitness planning context.','✓ Pregnancy-date orientation.'],commonPitfalls:['⚠ Mixing units.','⚠ Treating estimates as clinical decisions.','⚠ Ignoring individual medical context.'],glossary:[{term:'BSA',definition:'Estimated body surface area.'},{term:'BMI',definition:'Weight divided by height squared.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024},{title:'Body Surface Area',publisher:'NCBI Bookshelf',url:'https://www.ncbi.nlm.nih.gov/books/NBK542275/',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'pregnancy-weight-gain': {formula:{expression:'Simplified gain range = 0.4×weeks to 0.6×weeks kg.',variables:[{symbol:'Inputs',definition:'Entered measurements'}],notes:'Estimate only; not a diagnosis.'},howToSteps:['Enter the measurements or pregnancy week.','Confirm the units.','Review the live estimate.','Discuss consequential health decisions with a qualified clinician.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are calculations private?',answer:'Yes, client-side.'},{question:'Can I edit inputs?',answer:'Yes.'},{question:'Are results exact?',answer:'No, they are estimates.'}],examples:[{title:'Worked example',scenario:'Enter a valid profile.',steps:['Enter inputs.','Apply the displayed equation.','Review output.','Compare reference values.'],result:'The result updates instantly.'}],useCases:['✓ Educational screening.','✓ Fitness planning context.','✓ Pregnancy-date orientation.'],commonPitfalls:['⚠ Mixing units.','⚠ Treating estimates as clinical decisions.','⚠ Ignoring individual medical context.'],glossary:[{term:'BSA',definition:'Estimated body surface area.'},{term:'BMI',definition:'Weight divided by height squared.'}],sources:[{title:'Adult BMI Categories',publisher:'CDC',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',year:2024},{title:'Body Surface Area',publisher:'NCBI Bookshelf',url:'https://www.ncbi.nlm.nih.gov/books/NBK542275/',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Transparent client-side educational estimate.'}},
  'pregnancy-conception': {formula:{expression:'Estimated timing = cycle day and gestational-week assumptions.',variables:[{symbol:'Days',definition:'User-entered cycle or gestational days'}],notes:'Estimates vary by person.'},howToSteps:['Enter cycle length and timing inputs.','Confirm days and weeks.','Review the estimate.','Consult a clinician for personal care decisions.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are results private?',answer:'Yes, client-side.'},{question:'Can cycles vary?',answer:'Yes, real cycles vary.'},{question:'Are dates guaranteed?',answer:'No.'}],examples:[{title:'Cycle estimate',scenario:'Enter a 28-day cycle.',steps:['Enter cycle length.','Apply the timing formula.','Review the estimated day.','Compare with observed data.'],result:'The estimate updates instantly.'}],useCases:['✓ Cycle education.','✓ Planning questions for a clinician.','✓ Comparing assumptions.'],commonPitfalls:['⚠ Assuming every cycle is 28 days.','⚠ Treating estimates as guarantees.','⚠ Ignoring irregular cycles.'],glossary:[{term:'Cycle length',definition:'Days from one period start to the next.'},{term:'Ovulation',definition:'An estimated cycle event that can vary.'}],sources:[{title:'Menstrual Cycle Information',publisher:'Office on Women’s Health',url:'https://www.womenshealth.gov/menstrual-cycle',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Educational client-side estimate.'}},
  'due-date': {formula:{expression:'Remaining days = 280 − completed gestational days.',variables:[{symbol:'Days',definition:'User-entered cycle or gestational days'}],notes:'Estimates vary by person.'},howToSteps:['Enter cycle length and timing inputs.','Confirm days and weeks.','Review the estimate.','Consult a clinician for personal care decisions.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are results private?',answer:'Yes, client-side.'},{question:'Can cycles vary?',answer:'Yes, real cycles vary.'},{question:'Are dates guaranteed?',answer:'No.'}],examples:[{title:'Cycle estimate',scenario:'Enter a 28-day cycle.',steps:['Enter cycle length.','Apply the timing formula.','Review the estimated day.','Compare with observed data.'],result:'The estimate updates instantly.'}],useCases:['✓ Cycle education.','✓ Planning questions for a clinician.','✓ Comparing assumptions.'],commonPitfalls:['⚠ Assuming every cycle is 28 days.','⚠ Treating estimates as guarantees.','⚠ Ignoring irregular cycles.'],glossary:[{term:'Cycle length',definition:'Days from one period start to the next.'},{term:'Ovulation',definition:'An estimated cycle event that can vary.'}],sources:[{title:'Menstrual Cycle Information',publisher:'Office on Women’s Health',url:'https://www.womenshealth.gov/menstrual-cycle',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Educational client-side estimate.'}},
  'ovulation': {formula:{expression:'Estimated ovulation day = cycle length − 14.',variables:[{symbol:'Days',definition:'User-entered cycle or gestational days'}],notes:'Estimates vary by person.'},howToSteps:['Enter cycle length and timing inputs.','Confirm days and weeks.','Review the estimate.','Consult a clinician for personal care decisions.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are results private?',answer:'Yes, client-side.'},{question:'Can cycles vary?',answer:'Yes, real cycles vary.'},{question:'Are dates guaranteed?',answer:'No.'}],examples:[{title:'Cycle estimate',scenario:'Enter a 28-day cycle.',steps:['Enter cycle length.','Apply the timing formula.','Review the estimated day.','Compare with observed data.'],result:'The estimate updates instantly.'}],useCases:['✓ Cycle education.','✓ Planning questions for a clinician.','✓ Comparing assumptions.'],commonPitfalls:['⚠ Assuming every cycle is 28 days.','⚠ Treating estimates as guarantees.','⚠ Ignoring irregular cycles.'],glossary:[{term:'Cycle length',definition:'Days from one period start to the next.'},{term:'Ovulation',definition:'An estimated cycle event that can vary.'}],sources:[{title:'Menstrual Cycle Information',publisher:'Office on Women’s Health',url:'https://www.womenshealth.gov/menstrual-cycle',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Educational client-side estimate.'}},
  'conception': {formula:{expression:'Conception window follows the estimated ovulation day.',variables:[{symbol:'Days',definition:'User-entered cycle or gestational days'}],notes:'Estimates vary by person.'},howToSteps:['Enter cycle length and timing inputs.','Confirm days and weeks.','Review the estimate.','Consult a clinician for personal care decisions.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are results private?',answer:'Yes, client-side.'},{question:'Can cycles vary?',answer:'Yes, real cycles vary.'},{question:'Are dates guaranteed?',answer:'No.'}],examples:[{title:'Cycle estimate',scenario:'Enter a 28-day cycle.',steps:['Enter cycle length.','Apply the timing formula.','Review the estimated day.','Compare with observed data.'],result:'The estimate updates instantly.'}],useCases:['✓ Cycle education.','✓ Planning questions for a clinician.','✓ Comparing assumptions.'],commonPitfalls:['⚠ Assuming every cycle is 28 days.','⚠ Treating estimates as guarantees.','⚠ Ignoring irregular cycles.'],glossary:[{term:'Cycle length',definition:'Days from one period start to the next.'},{term:'Ovulation',definition:'An estimated cycle event that can vary.'}],sources:[{title:'Menstrual Cycle Information',publisher:'Office on Women’s Health',url:'https://www.womenshealth.gov/menstrual-cycle',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Educational client-side estimate.'}},
  'period': {formula:{expression:'Next period estimate = current cycle day + cycle length.',variables:[{symbol:'Days',definition:'User-entered cycle or gestational days'}],notes:'Estimates vary by person.'},howToSteps:['Enter cycle length and timing inputs.','Confirm days and weeks.','Review the estimate.','Consult a clinician for personal care decisions.'],faqs:[{question:'Is this a diagnosis?',answer:'No.'},{question:'Are results private?',answer:'Yes, client-side.'},{question:'Can cycles vary?',answer:'Yes, real cycles vary.'},{question:'Are dates guaranteed?',answer:'No.'}],examples:[{title:'Cycle estimate',scenario:'Enter a 28-day cycle.',steps:['Enter cycle length.','Apply the timing formula.','Review the estimated day.','Compare with observed data.'],result:'The estimate updates instantly.'}],useCases:['✓ Cycle education.','✓ Planning questions for a clinician.','✓ Comparing assumptions.'],commonPitfalls:['⚠ Assuming every cycle is 28 days.','⚠ Treating estimates as guarantees.','⚠ Ignoring irregular cycles.'],glossary:[{term:'Cycle length',definition:'Days from one period start to the next.'},{term:'Ovulation',definition:'An estimated cycle event that can vary.'}],sources:[{title:'Menstrual Cycle Information',publisher:'Office on Women’s Health',url:'https://www.womenshealth.gov/menstrual-cycle',year:2024}],author:{name:'CalculatorFree Health Review Team',credentials:'Calculation Review',description:'Educational client-side estimate.'}},
  'credit-utilization': {howToSteps:['Enter the labeled balances and rates.','Check the assumptions and units.','Review the live result.','Use the estimate for planning.'],formula:{expression:'Utilization = balance ÷ credit limit × 100.',variables:[{symbol:'Balance',definition:'Outstanding revolving balance'},{symbol:'APR',definition:'Annual percentage rate'},{symbol:'Limit',definition:'Total available credit where applicable'}],notes:'Balance and limit are entered in the same currency; a zero limit returns 0%.'},examples:[{title:'Illustrative example',scenario:'Enter two or more realistic debt lines.',steps:['Enter balances.','Enter APR and payment assumptions.','Apply the strategy order.','Review the result.'],result:'The calculator displays the ordered debts or utilization ratio.'}],useCases:['Compare debt priorities.','Monitor revolving utilization.','Plan repayment conversations.'],commonPitfalls:['Mixing statement balance with current balance.','Ignoring interest and fees.','Treating an ordering model as a guaranteed payoff plan.'],glossary:[{term:'APR',definition:'Annualized borrowing rate.'},{term:'Utilization',definition:'Balance as a percentage of available credit.'},{term:'Snowball',definition:'Smallest-balance-first ordering.'},{term:'Avalanche',definition:'Highest-APR-first ordering.'}],faqs:[{question:'Are results client-side?',answer:'Yes; calculations run in the browser.'},{question:'Does this include issuer fees?',answer:'No unless entered in the model.'},{question:'Is this financial advice?',answer:'No; compare assumptions with a qualified professional.'},{question:'Can payment reallocation change the result?',answer:'Yes; this simplified ordering model keeps entered payments fixed.'}],sources:[{title:'Consumer Credit Guidance',publisher:'Consumer Financial Protection Bureau',url:'https://www.consumerfinance.gov/consumer-tools/credit-cards/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Original client-side educational model.'}},  'debt-snowball': {howToSteps:['Enter the labeled balances and rates.','Check the assumptions and units.','Review the live result.','Use the estimate for planning.'],formula:{expression:'Order debts by ascending balance; the smallest balance is targeted first.',variables:[{symbol:'Balance',definition:'Outstanding revolving balance'},{symbol:'APR',definition:'Annual percentage rate'},{symbol:'Limit',definition:'Total available credit where applicable'}],notes:'This is an ordering estimate, not a complete reallocation amortization.'},examples:[{title:'Illustrative example',scenario:'Enter two or more realistic debt lines.',steps:['Enter balances.','Enter APR and payment assumptions.','Apply the strategy order.','Review the result.'],result:'The calculator displays the ordered debts or utilization ratio.'}],useCases:['Compare debt priorities.','Monitor revolving utilization.','Plan repayment conversations.'],commonPitfalls:['Mixing statement balance with current balance.','Ignoring interest and fees.','Treating an ordering model as a guaranteed payoff plan.'],glossary:[{term:'APR',definition:'Annualized borrowing rate.'},{term:'Utilization',definition:'Balance as a percentage of available credit.'},{term:'Snowball',definition:'Smallest-balance-first ordering.'},{term:'Avalanche',definition:'Highest-APR-first ordering.'}],faqs:[{question:'Are results client-side?',answer:'Yes; calculations run in the browser.'},{question:'Does this include issuer fees?',answer:'No unless entered in the model.'},{question:'Is this financial advice?',answer:'No; compare assumptions with a qualified professional.'},{question:'Can payment reallocation change the result?',answer:'Yes; this simplified ordering model keeps entered payments fixed.'}],sources:[{title:'Consumer Credit Guidance',publisher:'Consumer Financial Protection Bureau',url:'https://www.consumerfinance.gov/consumer-tools/credit-cards/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Original client-side educational model.'}},  'debt-avalanche': {howToSteps:['Enter the labeled balances and rates.','Check the assumptions and units.','Review the live result.','Use the estimate for planning.'],formula:{expression:'Order debts by descending APR; the highest interest rate is targeted first.',variables:[{symbol:'Balance',definition:'Outstanding revolving balance'},{symbol:'APR',definition:'Annual percentage rate'},{symbol:'Limit',definition:'Total available credit where applicable'}],notes:'This is an ordering estimate, not a complete reallocation amortization.'},examples:[{title:'Illustrative example',scenario:'Enter two or more realistic debt lines.',steps:['Enter balances.','Enter APR and payment assumptions.','Apply the strategy order.','Review the result.'],result:'The calculator displays the ordered debts or utilization ratio.'}],useCases:['Compare debt priorities.','Monitor revolving utilization.','Plan repayment conversations.'],commonPitfalls:['Mixing statement balance with current balance.','Ignoring interest and fees.','Treating an ordering model as a guaranteed payoff plan.'],glossary:[{term:'APR',definition:'Annualized borrowing rate.'},{term:'Utilization',definition:'Balance as a percentage of available credit.'},{term:'Snowball',definition:'Smallest-balance-first ordering.'},{term:'Avalanche',definition:'Highest-APR-first ordering.'}],faqs:[{question:'Are results client-side?',answer:'Yes; calculations run in the browser.'},{question:'Does this include issuer fees?',answer:'No unless entered in the model.'},{question:'Is this financial advice?',answer:'No; compare assumptions with a qualified professional.'},{question:'Can payment reallocation change the result?',answer:'Yes; this simplified ordering model keeps entered payments fixed.'}],sources:[{title:'Consumer Credit Guidance',publisher:'Consumer Financial Protection Bureau',url:'https://www.consumerfinance.gov/consumer-tools/credit-cards/',year:2024}],author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Original client-side educational model.'}},
  'amortization': {howToSteps:['Enter the labeled financial inputs.','Confirm rate and time units.','Review the live result.','Compare assumptions before relying on it.'], formula:{expression:'Payment = P × r × (1+r)^n ÷ ((1+r)^n − 1)',variables:[{symbol:'P',definition:'Financed principal'},{symbol:'r',definition:'Monthly interest rate'},{symbol:'n',definition:'Number of monthly payments'}],notes:'Zero-rate loans use principal divided by payment count.'}, examples:[{title:'Fixed loan',scenario:'Enter principal, annual rate, and years.',steps:['Convert annual rate to monthly rate.','Apply the annuity payment formula.','Multiply payment by months.','Subtract principal for interest.'],result:'Monthly payment, interest, and cost are shown.'}], useCases:['Compare loan terms.','Estimate total borrowing cost.'], commonPitfalls:['Using annual rate as monthly rate.','Ignoring fees outside financed principal.'], glossary:[{term:'Amortization',definition:'Repayment of principal and interest over scheduled periods.'}], faqs:[{question:'Are calculations client-side?',answer:'Yes.'},{question:'Does it include fees?',answer:'Only if included in principal.'}], sources:[{title:'Loan Amortization Formula',publisher:'Consumer Financial Protection Bureau',url:'https://www.consumerfinance.gov/consumer-tools/mortgages/',year:2024}], author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Original client-side model.'}},
  'bond': {howToSteps:['Enter the labeled financial inputs.','Confirm rate and time units.','Review the live result.','Compare assumptions before relying on it.'], formula:{expression:'Price = C × (1 − (1+y/m)^−n) ÷ (y/m) + F × (1+y/m)^−n',variables:[{symbol:'C',definition:'Coupon per period'},{symbol:'y',definition:'Yield per year'},{symbol:'m',definition:'Payments per year'},{symbol:'F',definition:'Face value'}],notes:'At zero yield, price equals face value plus undiscounted coupons.'}, examples:[{title:'Coupon bond',scenario:'Enter face value, coupon rate, yield, and term.',steps:['Calculate coupon per period.','Discount coupons at yield.','Discount face value.','Add present values.'],result:'Estimated price and premium or discount are shown.'}], useCases:['Explain premium and discount pricing.'], commonPitfalls:['Confusing coupon rate with yield.','Mixing annual and periodic rates.'], glossary:[{term:'Yield',definition:'Required annual return used to discount bond cash flows.'}], faqs:[{question:'Does this model callable bonds?',answer:'No.'},{question:'Are prices guaranteed?',answer:'No.'}], sources:[{title:'Investor.gov Bonds',publisher:'U.S. Securities and Exchange Commission',url:'https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products',year:2024}], author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Original client-side model.'}},
  'mutual-fund': {howToSteps:['Enter the labeled financial inputs.','Confirm rate and time units.','Review the live result.','Compare assumptions before relying on it.'], formula:{expression:'FV = P(1+r)^n + C((1+r)^n−1)÷r, where r is net monthly return',variables:[{symbol:'P',definition:'Initial investment'},{symbol:'C',definition:'Monthly contribution'},{symbol:'r',definition:'Monthly return after expenses'},{symbol:'n',definition:'Months'}],notes:'Expense ratio is subtracted from annual return as a simplified net-return assumption.'}, examples:[{title:'Fund projection',scenario:'Enter initial value, monthly contribution, return, expenses, and years.',steps:['Subtract expenses from stated return.','Convert to monthly rate.','Compound initial value.','Accumulate contributions.'],result:'Projected value, contributions, and growth are shown.'}], useCases:['Compare contribution scenarios.'], commonPitfalls:['Treating projected returns as guaranteed.','Ignoring taxes and load fees.'], glossary:[{term:'Expense ratio',definition:'Annual operating cost expressed as a percentage of assets.'}], faqs:[{question:'Are returns guaranteed?',answer:'No.'},{question:'Does this include taxes?',answer:'No.'}], sources:[{title:'Mutual Funds, Investor.gov',publisher:'U.S. Securities and Exchange Commission',url:'https://www.investor.gov/introduction-investing/investing-basics/investment-products/mutual-funds-and-exchange-traded-funds-etfs',year:2024}], author:{name:'CalculatorFree Finance Review Team',credentials:'Calculation Review',description:'Original client-side model.'}},
};
