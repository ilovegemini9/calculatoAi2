export interface PercentageInput {
  caseType: 'percentOf' | 'whatPercentOf' | 'change';
  x: number;
  y: number;
}

export interface PercentageResult {
  result: number;
  explanation: string;
}

export function calculatePercentage(input: PercentageInput): PercentageResult {
  let result = 0;
  let explanation = '';

  const xNum = input.x;
  const yNum = input.y;

  if (input.caseType === 'percentOf') {
    // What is X% of Y?
    // result = (X / 100) * Y
    result = (xNum / 100) * yNum;
    explanation = `${xNum}% of ${yNum} is ${Math.round(result * 10000) / 10000}.`;
  } else if (input.caseType === 'whatPercentOf') {
    // What percent of X is Y?
    // result = (Y / X) * 100
    if (xNum === 0) {
      result = 0;
      explanation = 'Cannot divide by zero.';
    } else {
      result = (yNum / xNum) * 100;
      explanation = `${yNum} is ${Math.round(result * 10000) / 10000}% of ${xNum}.`;
    }
  } else {
    // What is the percentage increase/decrease from X to Y?
    // result = ((Y - X) / X) * 100
    if (xNum === 0) {
      result = 0;
      explanation = 'Initial value (X) cannot be zero for percent change.';
    } else {
      result = ((yNum - xNum) / xNum) * 100;
      const type = result >= 0 ? 'increase' : 'decrease';
      explanation = `The percentage ${type} from ${xNum} to ${yNum} is ${Math.round(Math.abs(result) * 10000) / 10000}%.`;
    }
  }

  return {
    result: Math.round(result * 10000) / 10000,
    explanation
  };
}
