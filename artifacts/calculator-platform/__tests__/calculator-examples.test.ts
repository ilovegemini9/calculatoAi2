import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNumericWorkedExample } from '../config/calculator-examples';

test('worked examples contain concrete inputs and computed results', () => {
  for (const slug of ['percentage', 'discount', 'circle-area', 'compound-interest', 'bmi', 'pythagorean-theorem']) {
    const example = buildNumericWorkedExample(slug);
    assert.ok(example, `${slug} should have a computable numeric example`);
    assert.match(example.scenario, /Example:/);
    assert.ok(example.steps.length >= 2, `${slug} should show input and calculation steps`);
    assert.match(example.result, /Result:/);
    assert.doesNotMatch(example.result, /generic placeholder/i);
  }
});

test('example generator never invents a result when calculation fails', () => {
  assert.equal(buildNumericWorkedExample('not-a-real-calculator'), null);
});
