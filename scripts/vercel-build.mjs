import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const inventory = 'artifacts/calculator-platform/config/omni-inventory.json';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const parsed = readJson(inventory);
const calculators = Array.isArray(parsed)
  ? parsed
  : Array.isArray(parsed?.calculators)
    ? parsed.calculators
    : null;

if (!calculators) {
  throw new Error('omni-inventory.json must be an array or an object with a calculators array');
}

const seen = new Set();
for (const calculator of calculators) {
  const slug = calculator?.slug ?? calculator?.id;
  if (typeof slug !== 'string' || !slug.trim()) {
    throw new Error('Inventory contains a calculator without a valid id/slug');
  }
  if (seen.has(slug)) {
    throw new Error(`Duplicate calculator id/slug: ${slug}`);
  }
  seen.add(slug);
}

console.log(`Validated ${calculators.length} calculators from Omni inventory`);
execFileSync('pnpm', ['--filter', '@workspace/calculator-platform', 'build'], { stdio: 'inherit' });
