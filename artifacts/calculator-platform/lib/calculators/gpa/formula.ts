export interface Course {
  name: string;
  grade: string;
  credits: number;
  courseType: 'regular' | 'honors' | 'ap_ib';
}

export interface GPAInput {
  courses: Course[];
}

export interface GPAResult {
  gpa: number;
  unweightedGpa: number;
  totalCredits: number;
}

export const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0.0,
};

export function calculateGPA(input: GPAInput): GPAResult {
  if (input.courses.length === 0) {
    return { gpa: 0, unweightedGpa: 0, totalCredits: 0 };
  }

  let totalCredits = 0;
  let totalGradePointsWeighted = 0;
  let totalGradePointsUnweighted = 0;

  for (const course of input.courses) {
    const basePoints = GRADE_POINTS[course.grade] ?? 0.0;
    const credits = course.credits;

    totalCredits += credits;
    totalGradePointsUnweighted += basePoints * credits;

    const bonus = course.courseType === 'ap_ib' ? 1.0 : course.courseType === 'honors' ? 0.5 : 0;
    const weightedPoints = basePoints > 0 ? basePoints + bonus : 0;
    totalGradePointsWeighted += weightedPoints * credits;
  }

  return {
    gpa: Math.round((totalCredits > 0 ? totalGradePointsWeighted / totalCredits : 0) * 100) / 100,
    unweightedGpa:
      Math.round((totalCredits > 0 ? totalGradePointsUnweighted / totalCredits : 0) * 100) / 100,
    totalCredits,
  };
}
