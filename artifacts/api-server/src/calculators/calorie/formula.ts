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
  mildLoss: number; // 0.25 kg loss per week
  weightLoss: number; // 0.5 kg loss per week
  extremeLoss: number; // 1 kg loss per week
  mildGain: number; // 0.25 kg gain per week
  weightGain: number; // 0.5 kg gain per week
}

export function calculateCalorie(input: CalorieInput): CalorieResult {
  let weightKg = input.weight;
  let heightCm = input.height;

  if (input.system === 'imperial') {
    weightKg = input.weight * 0.45359237;
    heightCm = input.height * 2.54;
  }

  // Mifflin-St Jeor Formula
  let bmr = 0;
  if (input.gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * input.age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * input.age - 161;
  }

  // Activity multipliers
  let multiplier = 1.2;
  switch (input.activity) {
    case 'sedentary': multiplier = 1.2; break;
    case 'light': multiplier = 1.375; break;
    case 'moderate': multiplier = 1.55; break;
    case 'active': multiplier = 1.725; break;
    case 'very_active': multiplier = 1.9; break;
  }

  const tdee = bmr * multiplier;
  const maintain = Math.round(tdee);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    maintain,
    mildLoss: Math.round(maintain - 250),
    weightLoss: Math.round(maintain - 500),
    extremeLoss: Math.round(maintain - 1000),
    mildGain: Math.round(maintain + 250),
    weightGain: Math.round(maintain + 500)
  };
}
