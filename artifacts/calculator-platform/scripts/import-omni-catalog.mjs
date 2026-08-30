#!/usr/bin/env node

/**
 * One-time catalog discovery tool.
 *
 * Purpose:
 * - Discover calculator URL slugs from Omni's public "all calculators" index.
 * - Normalize and de-duplicate slugs against themselves and our existing catalog.
 * - Import ONLY catalog metadata (slug/source/category), never Omni page copy/content/code.
 *
 * The generated file is intentionally a research/coverage input. Each imported
 * calculator must receive an original implementation and original content before
 * it is indexable on our site.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SOURCE_URL = 'https://www.omnicalculator.com/all';
const OUTPUT = new URL('../config/omni-discovered-catalog.json', import.meta.url);
const EXISTING = new URL('../config/calculators.ts', import.meta.url);

function normalizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/[#?].*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+$/, '');
}

function isCandidate(href) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:')) return false;
  const slug = normalizeSlug(href);
  if (!slug || slug.includes('/')) return false;
  const blocked = new Set([
    '', 'all', 'about', 'contact', 'collections', 'press', 'privacy-policy',
    'terms-of-use', 'editorial-policy', 'search', 'jobs', 'blog', 'resource-library',
  ]);
  return !blocked.has(slug);
}

function extractLinks(html) {
  const links = new Set();
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(re)) {
    const href = match[1];
    if (isCandidate(href)) links.add(normalizeSlug(href));
  }
  return [...links].sort();
}

function extractExistingSlugs(source) {
  const slugs = new Set();
  const re = /slug\s*:\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(re)) slugs.add(normalizeSlug(match[1]));
  return slugs;
}

const response = await fetch(SOURCE_URL, {
  headers: { 'user-agent': 'CalculatorAI catalog research bot/1.0' },
});
if (!response.ok) throw new Error(`Omni catalog fetch failed: ${response.status}`);

const html = await response.text();
const discovered = extractLinks(html);
const existingSource = existsSync(EXISTING) ? await readFile(EXISTING, 'utf8') : '';
const existing = extractExistingSlugs(existingSource);
const uniqueNew = discovered.filter((slug) => !existing.has(slug));

const result = {
  source: SOURCE_URL,
  discoveredAt: new Date().toISOString(),
  sourceCount: discovered.length,
  existingCount: existing.size,
  newCount: uniqueNew.length,
  policy: 'Metadata-only discovery. Implementations and editorial content must be original.',
  calculators: uniqueNew.map((slug) => ({ slug, source: 'omni-research', status: 'unimplemented' })),
};

await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`Discovered: ${discovered.length}`);
console.log(`Already in our catalog: ${existing.size}`);
console.log(`New candidates: ${uniqueNew.length}`);
console.log(`Wrote ${OUTPUT.pathname}`);
