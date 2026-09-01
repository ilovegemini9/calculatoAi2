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

const res = await fetch(SOURCE, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
});
const html = await res.text();

// The /all page exposes calculator links in normal anchor tags. Keep only
// first-party calculator paths and deduplicate by normalized pathname.
const links = [...html.matchAll(/href=["']\/([a-z0-9-]+)\/([a-z0-9-]+)["'][^>]*>([^<]+)<\/a>/gi)]
  .map(([, category, slug, rawLabel]) => {
    const cleanLabel = rawLabel.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      slug: slug.trim().toLowerCase(),
      category: category.trim().toLowerCase(),
      title: cleanLabel,
      source: SOURCE,
    };
  })
  .filter(({ slug, category, title }) => 
    slug && 
    category && 
    title && 
    category !== 'favicons' && 
    category !== 'images' && 
    slug !== 'favicon.png' &&
    !slug.includes('.')
  );

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
