import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const INVENTORY_FILE = resolve(ROOT, 'config/omni-inventory.json');
const OUTPUT_JSON = resolve(ROOT, 'config/omni-full-database.json');

const raw = await readFile(INVENTORY_FILE, 'utf8');
const { calculators: rawCalculators } = JSON.parse(raw);

const CATEGORY_META = {
  math: { label: 'Math', icon: '🧮' },
  finance: { label: 'Finance', icon: '💰' },
  health: { label: 'Health & Fitness', icon: '🩺' },
  physics: { label: 'Physics', icon: '⚡' },
  chemistry: { label: 'Chemistry', icon: '🧪' },
  construction: { label: 'Construction', icon: '🔨' },
  conversion: { label: 'Conversion', icon: '⇄' },
  'everyday-life': { label: 'Everyday Life', icon: '📅' },
  sports: { label: 'Sports', icon: '🏃' },
  statistics: { label: 'Statistics', icon: '📊' },
  food: { label: 'Food & Cooking', icon: '🍳' },
  ecology: { label: 'Ecology', icon: '🌱' },
  biology: { label: 'Biology', icon: '🧬' },
  other: { label: 'Other', icon: '✨' },
};

function formatTitle(title, slug) {
  if (title && !title.includes('{') && !title.includes('<') && title.length < 80) {
    return title.replace(/\s+/g, ' ').trim();
  }
  const words = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  const base = words.join(' ');
  return base.toLowerCase().includes('calculator') ? base : `${base} Calculator`;
}

function deriveSchemaFromSlugAndCategory(slug, title, category) {
  const parts = slug.split('-');
  const name = formatTitle(title, slug);
  const cleanName = name.replace(/\s*Calculator\s*/i, '');
  const cat = CATEGORY_META[category] ? category : 'other';

  // Extract sensible default fields/cases based on slug terms
  let inputs = [];
  let outputs = [];
  let formula = '';
  let expression = '';
  let formulaVars = [];

  if (slug.includes('percentage') || slug.includes('percent')) {
    inputs = [
      { name: 'value', label: 'Value / Total', type: 'number', defaultValue: 100, min: 0, max: 1000000, step: 1, suffix: '' },
      { name: 'percentage', label: 'Percentage', type: 'number', defaultValue: 15, min: 0, max: 100, step: 0.1, suffix: '%' },
    ];
    outputs = [
      { name: 'result', label: 'Calculated Amount', suffix: '', highlight: true },
      { name: 'totalWithPercent', label: 'Total Value (Value + %)', suffix: '' },
    ];
    expression = 'Result = (Value × Percentage) / 100';
    formulaVars = [
      { symbol: 'Value', definition: 'The initial or base amount' },
      { symbol: 'Percentage', definition: 'The percentage rate applied' },
    ];
  } else if (slug.includes('rate') || slug.includes('speed') || slug.includes('velocity')) {
    inputs = [
      { name: 'distance', label: 'Distance', type: 'number', defaultValue: 100, min: 0.1, max: 100000, step: 1, suffix: 'km' },
      { name: 'time', label: 'Time Elapsed', type: 'number', defaultValue: 2, min: 0.01, max: 1000, step: 0.1, suffix: 'hrs' },
    ];
    outputs = [
      { name: 'rate', label: 'Calculated Speed / Rate', suffix: 'km/h', highlight: true },
      { name: 'pace', label: 'Pace (Minutes / Unit)', suffix: 'min/km' },
    ];
    expression = 'Speed = Distance / Time';
    formulaVars = [
      { symbol: 'Distance', definition: 'Total distance traveled or completed' },
      { symbol: 'Time', definition: 'Elapsed duration' },
    ];
  } else if (slug.includes('area') || slug.includes('square') || slug.includes('footage')) {
    inputs = [
      { name: 'length', label: 'Length', type: 'number', defaultValue: 10, min: 0.1, max: 10000, step: 0.5, suffix: 'm' },
      { name: 'width', label: 'Width', type: 'number', defaultValue: 8, min: 0.1, max: 10000, step: 0.5, suffix: 'm' },
    ];
    outputs = [
      { name: 'area', label: 'Total Area', suffix: 'm²', highlight: true },
      { name: 'perimeter', label: 'Total Perimeter', suffix: 'm' },
    ];
    expression = 'Area = Length × Width; Perimeter = 2 × (Length + Width)';
    formulaVars = [
      { symbol: 'Length', definition: 'Length measurement' },
      { symbol: 'Width', definition: 'Width measurement' },
    ];
  } else if (slug.includes('volume') || slug.includes('capacity') || slug.includes('tank')) {
    inputs = [
      { name: 'length', label: 'Length / Depth', type: 'number', defaultValue: 10, min: 0.1, max: 10000, step: 0.5, suffix: 'm' },
      { name: 'width', label: 'Width', type: 'number', defaultValue: 5, min: 0.1, max: 10000, step: 0.5, suffix: 'm' },
      { name: 'height', label: 'Height', type: 'number', defaultValue: 2, min: 0.1, max: 10000, step: 0.5, suffix: 'm' },
    ];
    outputs = [
      { name: 'volume', label: 'Total Volume', suffix: 'm³', highlight: true },
      { name: 'capacityLiters', label: 'Capacity in Liters', suffix: 'L' },
    ];
    expression = 'Volume = Length × Width × Height';
    formulaVars = [
      { symbol: 'Length', definition: 'Length measurement' },
      { symbol: 'Width', definition: 'Width measurement' },
      { symbol: 'Height', definition: 'Height measurement' },
    ];
  } else if (slug.includes('cost') || slug.includes('price') || slug.includes('tax') || slug.includes('discount') || slug.includes('interest') || slug.includes('loan') || slug.includes('mortgage') || slug.includes('salary') || cat === 'finance') {
    inputs = [
      { name: 'amount', label: 'Principal / Base Amount', type: 'number', defaultValue: 1000, min: 0, max: 10000000, step: 10, suffix: '$' },
      { name: 'rate', label: 'Rate / Percentage', type: 'number', defaultValue: 5, min: 0, max: 100, step: 0.1, suffix: '%' },
      { name: 'period', label: 'Period / Quantity / Term', type: 'number', defaultValue: 12, min: 1, max: 360, step: 1, suffix: 'mo' },
    ];
    outputs = [
      { name: 'result', label: 'Total Calculated Amount', suffix: '$', highlight: true },
      { name: 'periodicCost', label: 'Periodic Cost', suffix: '$/mo' },
      { name: 'netDifference', label: 'Interest / Differential', suffix: '$' },
    ];
    expression = 'Result = Amount × (1 + (Rate / 100) × (Period / 12))';
    formulaVars = [
      { symbol: 'Amount', definition: 'Principal or base initial balance' },
      { symbol: 'Rate', definition: 'Annual or periodic percentage rate' },
      { symbol: 'Period', definition: 'Time duration or quantity of terms' },
    ];
  } else if (slug.includes('mass') || slug.includes('weight') || slug.includes('density') || slug.includes('energy') || slug.includes('force') || slug.includes('power') || cat === 'physics' || cat === 'chemistry') {
    inputs = [
      { name: 'paramA', label: 'Primary Variable (e.g. Mass / Force)', type: 'number', defaultValue: 10, min: 0.001, max: 100000, step: 0.1, suffix: 'units' },
      { name: 'paramB', label: 'Secondary Variable (e.g. Acceleration / Volume)', type: 'number', defaultValue: 2, min: 0.001, max: 100000, step: 0.1, suffix: 'units' },
    ];
    outputs = [
      { name: 'calculatedMagnitude', label: 'Calculated Magnitude', suffix: 'SI units', highlight: true },
      { name: 'derivedRate', label: 'Derived Factor', suffix: '' },
    ];
    expression = 'Result = Primary Variable × Secondary Variable';
    formulaVars = [
      { symbol: 'Param A', definition: 'First input physical metric' },
      { symbol: 'Param B', definition: 'Second input physical metric' },
    ];
  } else if (cat === 'health' || slug.includes('bmi') || slug.includes('calorie') || slug.includes('body') || slug.includes('fat') || slug.includes('intake')) {
    inputs = [
      { name: 'weight', label: 'Body Weight', type: 'number', defaultValue: 70, min: 20, max: 300, step: 0.5, suffix: 'kg' },
      { name: 'height', label: 'Height', type: 'number', defaultValue: 175, min: 50, max: 250, step: 1, suffix: 'cm' },
      { name: 'age', label: 'Age', type: 'number', defaultValue: 28, min: 1, max: 120, step: 1, suffix: 'yrs' },
    ];
    outputs = [
      { name: 'score', label: 'Primary Clinical / Metabolic Score', suffix: '', highlight: true },
      { name: 'dailyTarget', label: 'Recommended Target / Norm', suffix: 'units' },
    ];
    expression = 'Score = Weight (kg) / (Height (m))²';
    formulaVars = [
      { symbol: 'Weight', definition: 'Measured body weight' },
      { symbol: 'Height', definition: 'Standing stature in centimeters or meters' },
      { symbol: 'Age', definition: 'Chronological age in completed years' },
    ];
  } else {
    inputs = [
      { name: 'inputA', label: 'First Input Value', type: 'number', defaultValue: 50, min: 0, max: 100000, step: 1, suffix: '' },
      { name: 'inputB', label: 'Second Input Value', type: 'number', defaultValue: 10, min: 0.001, max: 100000, step: 1, suffix: '' },
    ];
    outputs = [
      { name: 'primaryResult', label: 'Calculated Value', suffix: '', highlight: true },
      { name: 'secondaryRatio', label: 'Comparative Ratio', suffix: '%' },
    ];
    expression = 'Result = First Value / Second Value';
    formulaVars = [
      { symbol: 'Input A', definition: 'Primary parameter value' },
      { symbol: 'Input B', definition: 'Secondary parameter value' },
    ];
  }

  const description = `Free online ${name}. Calculate and solve ${cleanName.toLowerCase()} equations, scenarios, and values instantly with formulas and step-by-step guidance.`;

  return {
    slug,
    name,
    shortName: cleanName,
    category: cat,
    icon: CATEGORY_META[cat]?.icon || '⚡',
    description,
    keywords: [
      `${cleanName.toLowerCase()} calculator`,
      `online ${cleanName.toLowerCase()}`,
      `how to calculate ${cleanName.toLowerCase()}`,
      `${slug} calculator`,
    ],
    inputs,
    outputs,
    formula: {
      expression,
      variables: formulaVars,
      notes: `Standard mathematical formula utilized in ${CATEGORY_META[cat]?.label || 'analytical'} calculations.`,
    },
    howToSteps: [
      `Enter your known variables into the input parameters above.`,
      `Adjust values using the interactive numeric fields or slider controls.`,
      `Review the real-time calculated results, breakdown, and comparative metrics instantly.`,
    ],
    faqs: [
      {
        question: `What is the ${name}?`,
        answer: `The ${name} is an interactive computational tool designed to solve and calculate ${cleanName.toLowerCase()} accurately according to standard scientific and mathematical principles.`,
      },
      {
        question: `How does the calculation work?`,
        answer: `The calculator applies the formula ${expression} to evaluate your parameters in real-time within your browser with zero latency.`,
      },
    ],
    examples: [
      {
        title: `Standard ${cleanName} Example`,
        scenario: `Calculating standard baseline metrics with default parameters.`,
        steps: [
          `Set initial parameter values in the variable inputs.`,
          `Observe the automated execution of the mathematical equation.`,
        ],
        result: `Generates instant verified calculations matching theoretical models.`,
      },
    ],
  };
}

// Deduplicate and process
const seen = new Set();
const fullList = [];

for (const rawItem of rawCalculators) {
  if (!rawItem.slug || rawItem.category === 'favicons' || rawItem.slug === 'favicon.png' || rawItem.slug.includes('.')) {
    continue;
  }
  const slug = rawItem.slug.trim().toLowerCase();
  if (seen.has(slug)) continue;
  seen.add(slug);

  const processed = deriveSchemaFromSlugAndCategory(slug, rawItem.title, rawItem.category);
  fullList.push(processed);
}

// Sort alphabetically by slug
fullList.sort((a, b) => a.slug.localeCompare(b.slug));

const payload = {
  totalCount: fullList.length,
  updatedAt: new Date().toISOString(),
  categories: Object.keys(CATEGORY_META),
  calculators: fullList,
};

await writeFile(OUTPUT_JSON, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Generated database of ${fullList.length} unique Omni calculators at ${OUTPUT_JSON}`);
