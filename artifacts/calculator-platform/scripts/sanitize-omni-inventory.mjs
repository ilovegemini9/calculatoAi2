import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const file = resolve(new URL('../config/omni-inventory.json', import.meta.url).pathname);
const raw = await readFile(file, 'utf8');

// Repair literal JSON control characters that may have been introduced inside
// calculator titles/descriptions while preserving every inventory entry.
let out = '';
let inString = false;
let escaped = false;
let repaired = 0;

for (let i = 0; i < raw.length; i += 1) {
  const ch = raw[i];
  const code = raw.charCodeAt(i);

  if (inString) {
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      out += ch;
      inString = false;
      continue;
    }
    if (code < 0x20) {
      out += `\\u${code.toString(16).padStart(4, '0')}`;
      repaired += 1;
      continue;
    }
    out += ch;
  } else {
    out += ch;
    if (ch === '"') inString = true;
  }
}

if (repaired > 0) {
  JSON.parse(out);
  await writeFile(file, out, 'utf8');
  console.log(`Repaired ${repaired} JSON control characters in omni-inventory.json`);
} else {
  JSON.parse(raw);
  console.log('omni-inventory.json is already valid JSON');
}
