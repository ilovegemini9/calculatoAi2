import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CALCULATORS } from '../config/calculators';
import { CALCULATOR_CONTENT } from '../config/calculator-content';
import { CALCULATOR_SPECS, listFunctionalCalculators, getCalculatorSpec } from '../config/calculator-engine';

const rendererPath = path.resolve(process.cwd(), 'components/calculators/CalculatorRenderer.tsx');
const rendererSource = fs.readFileSync(rendererPath, 'utf8');

function hasDedicatedRenderer(slug: string): boolean {
  // CalculatorRenderer uses explicit slug branches. Keep this deliberately strict:
  // a mention in a comment/import is not enough to count as a renderer.
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`case\\s+[\\\'\\\"]${escaped}[\\\'\\\"]\\s*:`).test(rendererSource);
}

test('full calculator inventory has no duplicate slugs', () => {
  const slugs = CALCULATORS.map((calculator) => calculator.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate calculator slugs found');
});

test('full calculator inventory has complete metadata', () => {
  const failures = CALCULATORS.filter((calculator) =>
    !calculator.slug.trim() ||
    !calculator.name.trim() ||
    !calculator.shortName.trim() ||
    !calculator.description.trim() ||
    calculator.keywords.length === 0,
  );

  assert.deepEqual(
    failures.map((calculator) => calculator.slug),
    [],
    'calculators with incomplete metadata',
  );
});

test('every listed calculator has verified executable logic', () => {
  const functional = new Set(listFunctionalCalculators());
  const missing = CALCULATORS
    .map((calculator) => calculator.slug)
    .filter((slug) => !functional.has(slug) && !hasDedicatedRenderer(slug));

  assert.deepEqual(
    missing,
    [],
    `No verified engine handler or dedicated renderer for: ${missing.join(', ')}`,
  );
});

test('every engine-backed calculator has real input/output specifications', () => {
  const specBySlug = new Map(CALCULATOR_SPECS.map((spec) => [spec.slug, spec]));
  const failures: string[] = [];

  for (const slug of listFunctionalCalculators()) {
    const spec = specBySlug.get(slug);
    if (!spec) {
      failures.push(`${slug}: missing spec`);
      continue;
    }
    if (!spec.inputs.length) failures.push(`${slug}: no inputs`);
    if (!spec.outputs.length) failures.push(`${slug}: no outputs`);
    for (const input of spec.inputs) {
      if (!input.key?.trim() || !input.label?.trim()) failures.push(`${slug}: invalid input metadata`);
    }
    for (const output of spec.outputs) {
      if (!output.key?.trim() || !output.label?.trim()) failures.push(`${slug}: invalid output metadata`);
    }
  }

  assert.deepEqual(failures, [], failures.join('\n'));
});

test('every listed calculator has rich content or a verified spec fallback', () => {
  const failures = CALCULATORS
    .map((calculator) => calculator.slug)
    .filter((slug) => {
      const content = CALCULATOR_CONTENT[slug];
      if (content?.howToSteps?.length && content?.examples?.length && content?.faqs?.length && content?.formula?.expression?.trim()) {
        return false;
      }
      try {
        const spec = getCalculatorSpec(slug);
        return !spec.inputs.length || !spec.outputs.length || !spec.formula?.expression?.trim();
      } catch {
        return true;
      }
    });

  assert.deepEqual(
    failures,
    [],
    `Thin calculators without canonical content or spec fallback: ${failures.join(', ')}`,
  );
});

test('calculator audit summary', () => {
  const functional = new Set(listFunctionalCalculators());
  const dedicated = CALCULATORS.filter(({ slug }) => hasDedicatedRenderer(slug));
  const engineBacked = CALCULATORS.filter(({ slug }) => functional.has(slug));
  const richContent = CALCULATORS.filter(({ slug }) => {
    const content = CALCULATOR_CONTENT[slug];
    return Boolean(content?.howToSteps?.length && content?.examples?.length && content?.faqs?.length && content?.formula?.expression?.trim());
  });

  console.log(JSON.stringify({
    total: CALCULATORS.length,
    engineBacked: engineBacked.length,
    dedicatedRenderer: dedicated.length,
    richCanonicalContent: richContent.length,
    duplicateSlugs: CALCULATORS.length - new Set(CALCULATORS.map(({ slug }) => slug)).size,
    uncovered: CALCULATORS.filter(({ slug }) => !functional.has(slug) && !hasDedicatedRenderer(slug)).map(({ slug }) => slug),
  }, null, 2));

  assert.ok(CALCULATORS.length >= 200, `Expected the canonical inventory to contain 200+ calculators; got ${CALCULATORS.length}`);
});
