import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const inventory = 'artifacts/calculator-platform/config/omni-inventory.json';
const rawBytes = fs.readFileSync(inventory);
// Recover malformed UTF-8 without changing JSON structure. Invalid byte
// sequences become U+FFFD, which is valid JSON string data.
const raw = new TextDecoder('utf-8', { fatal: false }).decode(rawBytes);
let out = '';
let inString = false;
let escaped = false;
for (const ch of raw) {
  const code = ch.charCodeAt(0);
  if (escaped) { out += ch; escaped = false; continue; }
  if (inString && ch === '\\') { out += ch; escaped = true; continue; }
  if (ch === '"') { out += ch; inString = !inString; continue; }
  if (inString && code < 32) {
    out += code === 10 ? '\\n' : code === 13 ? '\\r' : code === 9 ? '\\t' : `\\u${code.toString(16).padStart(4, '0')}`;
  } else out += ch;
}
const parsed = JSON.parse(out);
if (!Array.isArray(parsed)) throw new Error('omni-inventory.json must contain an array');
fs.writeFileSync(inventory, JSON.stringify(parsed));
execFileSync('node', ['artifacts/calculator-platform/scripts/generate-omni-database.mjs'], { stdio: 'inherit' });
execFileSync('pnpm', ['--filter', '@workspace/calculator-platform', 'build'], { stdio: 'inherit' });
