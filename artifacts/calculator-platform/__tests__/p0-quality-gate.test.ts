import test from 'node:test';
import assert from 'node:assert/strict';
import { checkP0Quality } from '../lib/p0-quality-gate';

test('P0 quality gate accepts complete canonical content', () => {
  const result = checkP0Quality('age');
  assert.equal(result.slug, 'age');
  assert.equal(result.indexable, true, result.reasons.join(', '));
});

test('P0 quality gate rejects an unknown calculator', () => {
  const result = checkP0Quality('does-not-exist');
  assert.equal(result.indexable, false);
  assert.ok(result.reasons.includes('not-p0'));
  assert.ok(result.reasons.includes('missing-calculator-meta'));
});

test('P0 quality gate requires core content sections', () => {
  const result = checkP0Quality('age', {
    slug: 'age',
    name: 'Age Calculator',
    shortName: 'Age',
    description: 'Calculate age.',
    icon: '🎂',
    category: 'health-lifestyle',
    keywords: ['age calculator'],
  });
  assert.equal(result.indexable, false);
  assert.ok(result.reasons.includes('missing-content'));
});
