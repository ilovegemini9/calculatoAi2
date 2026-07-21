import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateGPA, GRADE_POINTS } from '../lib/calculators/gpa/formula';

describe('calculateGPA — empty & edge cases', () => {
  it('empty course list → 0 / 0 / 0', () => {
    const r = calculateGPA({ courses: [] });
    assert.strictEqual(r.gpa, 0);
    assert.strictEqual(r.unweightedGpa, 0);
    assert.strictEqual(r.totalCredits, 0);
  });

  it('single A (regular, 3 credits) → 4.0 / 4.0 / 3', () => {
    const r = calculateGPA({ courses: [{ name: 'Math', grade: 'A', credits: 3, courseType: 'regular' }] });
    assert.strictEqual(r.gpa, 4.0);
    assert.strictEqual(r.unweightedGpa, 4.0);
    assert.strictEqual(r.totalCredits, 3);
  });

  it('single F (regular) → 0.0 / 0.0', () => {
    const r = calculateGPA({ courses: [{ name: 'Math', grade: 'F', credits: 3, courseType: 'regular' }] });
    assert.strictEqual(r.gpa, 0.0);
    assert.strictEqual(r.unweightedGpa, 0.0);
  });
});

describe('calculateGPA — weighted vs unweighted', () => {
  // AP Calc A (4cr) + English Honors B+ (3cr) + PE A (1cr)
  // Weighted: (5.0×4 + 3.8×3 + 4.0×1) / 8 = 35.4/8 = 4.425 → 4.43
  // Unweighted: (4.0×4 + 3.3×3 + 4.0×1) / 8 = 29.9/8 = 3.7375 → 3.74
  const r = calculateGPA({
    courses: [
      { name: 'AP Calculus', grade: 'A',  credits: 4, courseType: 'ap_ib'   },
      { name: 'English',     grade: 'B+', credits: 3, courseType: 'honors'  },
      { name: 'PE',          grade: 'A',  credits: 1, courseType: 'regular' },
    ],
  });

  it('weighted GPA = 4.43', () => assert.strictEqual(r.gpa, 4.43));
  it('unweighted GPA = 3.74', () => assert.strictEqual(r.unweightedGpa, 3.74));
  it('totalCredits = 8', () => assert.strictEqual(r.totalCredits, 8));
  it('weighted ≥ unweighted when AP/Honors present', () => assert.ok(r.gpa >= r.unweightedGpa));
});

describe('calculateGPA — credit weighting', () => {
  it('4-credit A vs 1-credit F: unweighted avg = 3.2', () => {
    // (4.0×4 + 0×1) / 5 = 16/5 = 3.2
    const r = calculateGPA({
      courses: [
        { name: 'Major', grade: 'A', credits: 4, courseType: 'regular' },
        { name: 'Minor', grade: 'F', credits: 1, courseType: 'regular' },
      ],
    });
    assert.strictEqual(r.unweightedGpa, 3.2);
  });
});

describe('calculateGPA — grade point scale', () => {
  it('A+ = 4.0, A = 4.0', () => {
    assert.strictEqual(GRADE_POINTS['A+'], 4.0);
    assert.strictEqual(GRADE_POINTS['A'],  4.0);
  });
  it('B+ = 3.3, B = 3.0, B- = 2.7', () => {
    assert.strictEqual(GRADE_POINTS['B+'], 3.3);
    assert.strictEqual(GRADE_POINTS['B'],  3.0);
    assert.strictEqual(GRADE_POINTS['B-'], 2.7);
  });
  it('F = 0.0', () => assert.strictEqual(GRADE_POINTS['F'], 0.0));
});

describe('calculateGPA — F-grade bonus suppression', () => {
  it('AP/F gets no difficulty bonus (base = 0 guard)', () => {
    const ap  = calculateGPA({ courses: [{ name: 'AP', grade: 'F', credits: 3, courseType: 'ap_ib'   }] });
    const reg = calculateGPA({ courses: [{ name: 'R',  grade: 'F', credits: 3, courseType: 'regular' }] });
    assert.strictEqual(ap.gpa,  0.0);
    assert.strictEqual(reg.gpa, 0.0);
  });
});

describe('calculateGPA — rounding', () => {
  it('A- + B+ + C over 3 equal credits = 3.0', () => {
    // (3.7 + 3.3 + 2.0) / 3 = 9.0 / 3 = 3.0
    const r = calculateGPA({
      courses: [
        { name: 'A', grade: 'A-', credits: 1, courseType: 'regular' },
        { name: 'B', grade: 'B+', credits: 1, courseType: 'regular' },
        { name: 'C', grade: 'C',  credits: 1, courseType: 'regular' },
      ],
    });
    assert.strictEqual(r.unweightedGpa, 3.0);
  });
});
