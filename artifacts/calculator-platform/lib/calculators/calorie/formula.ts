export interface CalorieInput {
  system: 'metric' | 'imperial';
  age: number;
  gender: 'male' | 'female';
  weight: number; // kg or lbs
  height: number; // cm or inches
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface CalorieResult {
  bmr: number;
  tdee: number;
  maintain: number;
  mildLoss: number;
  weightLoss: number;
  extremeLoss: number;
  mildGain: number;
  weightGain: number;
}

export function calculateCalorie(input: CalorieInput): CalorieResult {
  let weightKg = input.weight;
  let heightCm = input.height;

  if (input.system === 'imperial') {
    weightKg = input.weight * 0.45359237;
    heightCm = input.height * 2.54;
  }

  let bmr = 0;
  if (input.gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * input.age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * input.age - 161;
  }

  const multipliers: Record<CalorieInput['activity'], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * multipliers[input.activity];
  const maintain = Math.round(tdee);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    maintain,
    mildLoss: Math.round(maintain - 250),
    weightLoss: Math.round(maintain - 500),
    extremeLoss: Math.round(maintain - 1000),
    mildGain: Math.round(maintain + 250),
    weightGain: Math.round(maintain + 500),
  };
}
