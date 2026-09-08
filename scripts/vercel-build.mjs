import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const inventory = 'artifacts/calculator-platform/config/omni-inventory.json';
const database = 'artifacts/calculator-platform/config/omni-full-database.json';
const knownGood = '169fda2d44f8a96c9c6584f48b7d20a7e21107e0';

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

try {
  readJson(inventory);
} catch {
  // The current inventory is corrupted. Restore the last known-good Omni
  // snapshot directly from Git history, then validate it.
  const restored = execFileSync('git', ['show', `${knownGood}:${inventory}`]);
  fs.writeFileSync(inventory, restored);
  const restoredDb = execFileSync('git', ['show', `${knownGood}:${database}`]);
  fs.writeFileSync(database, restoredDb);
}

const parsed = readJson(inventory);
const calculators = Array.isArray(parsed) ? parsed : parsed.calculators;
if (!Array.isArray(calculators)) {
  throw new Error('omni-inventory.json must contain a calculators array');
}

const db = readJson(database);
if (!Number.isInteger(db.totalCount) || db.totalCount !== calculators.length) {
  throw new Error(`Inventory/database count mismatch: inventory=${calculators.length}, database=${db.totalCount}`);
}

execFileSync('pnpm', ['--filter', '@workspace/calculator-platform', 'build'], { stdio: 'inherit' });
