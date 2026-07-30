export interface Course {
  name: string;
  grade: string; // 'A', 'A-', etc.
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
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0
};

export function calculateGPA(input: GPAInput): GPAResult {
  let totalCredits = 0;
  let totalGradePointsWeighted = 0;
  let totalGradePointsUnweighted = 0;

  if (input.courses.length === 0) {
    return { gpa: 0, unweightedGpa: 0, totalCredits: 0 };
  }

  for (const course of input.courses) {
    const basePoints = GRADE_POINTS[course.grade] ?? 0.0;
    const credits = course.credits;

    totalCredits += credits;
    totalGradePointsUnweighted += basePoints * credits;

    let bonus = 0;
    if (course.courseType === 'honors') {
      bonus = 0.5;
    } else if (course.courseType === 'ap_ib') {
      bonus = 1.0;
    }
    
    // Weighted GPA adds bonus to the class points (up to 5.0 scale for AP)
    const weightedPoints = basePoints > 0 ? (basePoints + bonus) : 0;
    totalGradePointsWeighted += weightedPoints * credits;
  }

  const unweightedGpa = totalCredits > 0 ? totalGradePointsUnweighted / totalCredits : 0;
  const gpa = totalCredits > 0 ? totalGradePointsWeighted / totalCredits : 0;

  return {
    gpa: Math.round(gpa * 100) / 100,
    unweightedGpa: Math.round(unweightedGpa * 100) / 100,
    totalCredits
  };
}
