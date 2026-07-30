export interface BMIInput {
  system: 'metric' | 'imperial';
  weight: number; // kg or lbs
  height: number; // cm or inches
}

export interface BMIResult {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese';
  healthyRangeText: string;
  recommendation: string;
}

export function calculateBMI(input: BMIInput): BMIResult {
  let bmi = 0;
  if (input.system === 'metric') {
    const heightInMeters = input.height / 100;
    bmi = input.weight / (heightInMeters * heightInMeters);
  } else {
    // Imperial: bmi = 703 * weight / height^2
    bmi = (703 * input.weight) / (input.height * input.height);
  }

  bmi = Math.round(bmi * 10) / 10;

  let category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese' = 'Normal weight';
  let recommendation = '';
  let healthyRangeText = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    recommendation = 'You are in the underweight category. It is recommended to consult a nutritionist or doctor to see if you need to gain weight healthy.';
  } else if (bmi < 25) {
    category = 'Normal weight';
    recommendation = 'Congratulations! You are maintaining a healthy body weight. Keep up the balanced diet and regular physical activity.';
  } else if (bmi < 30) {
    category = 'Overweight';
    recommendation = 'You are in the overweight range. Incorporating more physical activities and managing portions can help you reach a healthier range.';
  } else {
    category = 'Obese';
    recommendation = 'You are categorized in the obese range. We recommend speaking with a healthcare professional to establish safe fitness and diet plans.';
  }

  if (input.system === 'metric') {
    const minWeight = Math.round(18.5 * Math.pow(input.height / 100, 2) * 10) / 10;
    const maxWeight = Math.round(24.9 * Math.pow(input.height / 100, 2) * 10) / 10;
    healthyRangeText = `${minWeight} kg - ${maxWeight} kg`;
  } else {
    const minWeight = Math.round((18.5 * Math.pow(input.height, 2)) / 703 * 10) / 10;
    const maxWeight = Math.round((24.9 * Math.pow(input.height, 2)) / 703 * 10) / 10;
    healthyRangeText = `${minWeight} lbs - ${maxWeight} lbs`;
  }

  return {
    bmi,
    category,
    healthyRangeText,
    recommendation
  };
}
