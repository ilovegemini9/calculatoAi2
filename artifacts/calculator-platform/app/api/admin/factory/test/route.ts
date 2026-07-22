import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { validateGeneratedCode } from '@/lib/security';
import type { TestCase, TestResult } from '@/lib/types';

function runTests(calculateBody: string, tests: TestCase[]): TestResult[] {
  return tests.map((test) => {
    try {
      // Security check on the body before running
      const violations = validateGeneratedCode({ meta: { calculateBody } });
      if (violations.length > 0) {
        return {
          name: test.name,
          type: test.type,
          passed: false,
          expected: test.expectedOutputs,
          error: `Security violation: ${violations.join(', ')}`,
        };
      }

      // Run the formula with sandboxed Function
      // eslint-disable-next-line no-new-func
      const runner = new Function('inputs', calculateBody);
      const actual = runner(test.inputs) as Record<string, unknown>;

      if (typeof actual !== 'object' || actual === null) {
        return {
          name: test.name,
          type: test.type,
          passed: false,
          expected: test.expectedOutputs,
          error: 'Formula did not return an object',
        };
      }

      // Compare each expected output
      const tolerance = test.tolerance ?? 0.01; // 1% relative tolerance by default
      let passed = true;
      const failures: string[] = [];

      for (const [key, expectedVal] of Object.entries(test.expectedOutputs)) {
        const actualVal = actual[key];
        if (actualVal === undefined) {
          passed = false;
          failures.push(`Output "${key}" is missing`);
          continue;
        }

        if (typeof expectedVal === 'number' && typeof actualVal === 'number') {
          // Relative tolerance comparison for numbers
          const denom = Math.abs(expectedVal) > 1e-9 ? Math.abs(expectedVal) : 1;
          const relError = Math.abs(actualVal - expectedVal) / denom;
          if (relError > tolerance) {
            passed = false;
            failures.push(`"${key}": expected ${expectedVal}, got ${actualVal} (diff ${(relError * 100).toFixed(2)}%)`);
          }
        } else {
          // String / boolean comparison
          if (String(actualVal) !== String(expectedVal)) {
            passed = false;
            failures.push(`"${key}": expected "${expectedVal}", got "${actualVal}"`);
          }
        }
      }

      return {
        name: test.name,
        type: test.type,
        passed,
        actual,
        expected: test.expectedOutputs,
        error: failures.length > 0 ? failures.join('; ') : undefined,
      };
    } catch (err: unknown) {
      return {
        name: test.name,
        type: test.type,
        passed: false,
        expected: test.expectedOutputs,
        error: err instanceof Error ? err.message : 'Runtime error',
      };
    }
  });
}

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { calculateBody, tests, slug } = await req.json();

    if (!calculateBody || !Array.isArray(tests)) {
      return NextResponse.json({ error: 'calculateBody and tests are required' }, { status: 400 });
    }

    const results = runTests(calculateBody, tests as TestCase[]);
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const allPassed = failed === 0 && results.length > 0;

    // If a slug is provided, persist test results to the DB
    if (slug) {
      try {
        const db = getDb();
        const idx = db.calculators.findIndex((c) => c.slug === slug);
        if (idx > -1) {
          db.calculators[idx].metadata.testStatus = allPassed ? 'passed' : 'failed';
          db.calculators[idx].metadata.lastTestRun = new Date().toISOString();
          db.calculators[idx].metadata.testResults = results;
          saveDb(db);
        }
      } catch {
        // Non-fatal — still return results
      }
    }

    return NextResponse.json({ results, passed, failed, total: results.length, allPassed });
  } catch (err: unknown) {
    console.error('[factory/test] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
