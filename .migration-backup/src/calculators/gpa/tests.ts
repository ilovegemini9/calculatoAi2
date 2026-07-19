import { calculateGPA } from './formula';

export function runTests(): { success: boolean; logs: string[] } {
  const logs: string[] = [];
  try {
    const result = calculateGPA({
      courses: [
        { name: 'Math', grade: 'A', credits: 4, courseType: 'ap_ib' }, // 4 credits * (4.0 + 1.0 AP) = 20 points
        { name: 'English', grade: 'B', credits: 3, courseType: 'regular' }, // 3 credits * 3.0 = 9 points
        { name: 'History', grade: 'A-', credits: 3, courseType: 'honors' } // 3 credits * (3.7 + 0.5 Honors) = 12.6 points
      ]
    });

    // Unweighted grade points = (4.0*4) + (3.0*3) + (3.7*3) = 16 + 9 + 11.1 = 36.1 points
    // Total Credits = 10
    // Unweighted GPA = 3.61
    // Weighted GPA points = (5.0*4) + (3.0*3) + (4.2*3) = 20 + 9 + 12.6 = 41.6 points
    // Weighted GPA = 4.16

    logs.push(`Test 1 (Standard GPA calculation): Weighted GPA: ${result.gpa}, Unweighted GPA: ${result.unweightedGpa}`);
    if (result.unweightedGpa !== 3.61) {
      throw new Error(`Expected Unweighted GPA of 3.61, got ${result.unweightedGpa}`);
    }
    if (result.gpa !== 4.16) {
      throw new Error(`Expected Weighted GPA of 4.16, got ${result.gpa}`);
    }

    logs.push('All GPA tests passed.');
    return { success: true, logs };
  } catch (err: any) {
    logs.push(`Test Failed: ${err.message}`);
    return { success: false, logs };
  }
}
