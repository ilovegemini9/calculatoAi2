'use client';

import { useState } from 'react';
import { calculateGPA, GRADE_POINTS, type Course } from '@/lib/calculators/gpa/formula';
import { ResultCard, ResultsPanel } from './ResultCard';
import { cn } from '@/lib/utils';

const GRADES = Object.keys(GRADE_POINTS);

const defaultCourse = (): Course => ({ name: '', grade: 'A', credits: 3, courseType: 'regular' });

export function GPACalculator() {
  const [courses, setCourses] = useState<Course[]>([defaultCourse(), defaultCourse()]);

  const updateCourse = (i: number, field: keyof Course, value: string | number) =>
    setCourses(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const addCourse = () => setCourses(prev => [...prev, defaultCourse()]);
  const removeCourse = (i: number) => setCourses(prev => prev.filter((_, idx) => idx !== i));

  const result = calculateGPA({ courses: courses.filter(c => c.credits > 0) });

  const cellClass = 'px-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none w-full';

  return (
    <div className="space-y-6">
      {/* Results */}
      <ResultsPanel>
        <ResultCard highlight label="Weighted GPA" value={result.gpa.toFixed(2)} />
        <ResultCard label="Unweighted GPA" value={result.unweightedGpa.toFixed(2)} />
        <ResultCard label="Total Credits" value={result.totalCredits.toString()} />
      </ResultsPanel>

      {/* Course table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Courses</h3>
          <button onClick={addCourse}
            className="text-xs font-bold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            + Add Course
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Course Name</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Grade</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Credits</th>
                <th className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-2.5">
                    <input value={course.name} onChange={e => updateCourse(i, 'name', e.target.value)}
                      placeholder="e.g. Math 101" className={cellClass} />
                  </td>
                  <td className="px-4 py-2.5">
                    <select value={course.grade} onChange={e => updateCourse(i, 'grade', e.target.value)} className={cellClass}>
                      {GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input type="number" value={course.credits} min={0.5} max={6} step={0.5}
                      onChange={e => updateCourse(i, 'credits', parseFloat(e.target.value) || 0)}
                      className={cn(cellClass, 'w-20')} />
                  </td>
                  <td className="px-4 py-2.5">
                    <select value={course.courseType} onChange={e => updateCourse(i, 'courseType', e.target.value)} className={cellClass}>
                      <option value="regular">Regular</option>
                      <option value="honors">Honors (+0.5)</option>
                      <option value="ap_ib">AP / IB (+1.0)</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => removeCourse(i)} className="text-red-400 hover:text-red-600 transition text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
