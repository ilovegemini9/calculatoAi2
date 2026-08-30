#!/usr/bin/env node
/**
 * Imports Omni Calculator's public calculator index as an inventory source.
 * This is an inventory/discovery tool only: it does not copy Omni article text,
 * formulas, code, images, or other page content into the application.
 *
 * Usage:
 *   node scripts/import-omni-inventory.mjs
 *
 * Output:
 *   config/omni-inventory.json
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SOURCE = 'https://www.omnicalculator.com/all';
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const OUT = resolve(ROOT, 'config/omni-inventory.json');

const html = await (await fetch(SOURCE, { headers: { 'user-agent': 'calculatoAi2-inventory/1.0' } })).text();

// The /all page exposes calculator links in normal anchor tags. Keep only
// first-party calculator paths and deduplicate by normalized pathname.
const links = [...html.matchAll(/href=["'](\/[^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
  .map(([, href, label]) => ({ href, label: label.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }))
  .filter(({ href, label }) => href && label && href.split('/').filter(Boolean).length === 2)
  .map(({ href, label }) => ({
    slug: href.split('/').filter(Boolean)[1],
    category: href.split('/').filter(Boolean)[0],
    title: label,
    source: SOURCE,
  }));

const unique = new Map();
for (const item of links) {
  if (!unique.has(item.slug)) unique.set(item.slug, item);
}

const calculators = [...unique.values()].sort((a, b) => a.slug.localeCompare(b.slug));
const manifest = {
  source: SOURCE,
  importedAt: new Date().toISOString(),
  sourceClaimedCount: 3916,
  discoveredCount: calculators.length,
  policy: {
    free: true,
    noDuplicateSlugs: true,
    originalImplementationRequired: true,
    noOmniArticleCopy: true,
  },
  calculators,
};

await mkdir(resolve(ROOT, 'config'), { recursive: true });
await writeFile(OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Imported ${calculators.length} unique calculator entries from ${SOURCE}`);
