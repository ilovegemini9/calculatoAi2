import assert from 'node:assert/strict';
import { CALCULATORS } from '../config/calculators';
import { CALCULATOR_CONTENT } from '../config/calculator-content';
import { getKeywordClusterId, KEYWORD_CLUSTERS } from '../config/keyword-clusters';
import { defaultLlmsTxt, ensureLlmsCalculatorCoverage } from '../lib/seo';

const baseUrl = 'https://example.test';
const generated = defaultLlmsTxt(baseUrl);

assert.equal(KEYWORD_CLUSTERS.length, 5);
assert.equal(new Set(KEYWORD_CLUSTERS.map((cluster) => cluster.id)).size, 5);
assert.ok(CALCULATORS.every((calculator) => getKeywordClusterId(calculator.slug)));
assert.ok(CALCULATORS.every((calculator) => generated.includes(`${baseUrl}/${calculator.slug}-calculator`)));

const partial = '- [Mortgage](https://example.test/mortgage-calculator)';
const covered = ensureLlmsCalculatorCoverage(partial, baseUrl);
assert.ok(covered.includes(`${baseUrl}/mortgage-calculator`));
assert.ok(covered.includes(`${baseUrl}/${CALCULATORS.at(-1)?.slug}-calculator`));

const scientific = CALCULATOR_CONTENT.scientific;
assert.ok(scientific);
assert.equal(scientific.howToSteps.length, 4);
assert.match(scientific.formula?.expression ?? '', /sin\(x\).*cos\(x\).*ln\(x\)/);
assert.ok(scientific.faqs.some((faq) => /radians/i.test(faq.answer)));

console.log('SEO cluster and llms coverage tests passed');
