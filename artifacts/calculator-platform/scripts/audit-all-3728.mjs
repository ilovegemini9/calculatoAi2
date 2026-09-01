import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'omni-full-database.json'), 'utf8'));
const entries = Array.isArray(catalog.calculators) ? catalog.calculators : [];
const engine = await import(pathToFileURL(path.join(ROOT, 'config', 'calculator-engine.ts')).href);
const specs = new Map((engine.CALCULATOR_SPECS || []).map((s) => [s.slug, s]));

const source = fs.readFileSync(path.join(ROOT, 'config', 'calculator-engine.ts'), 'utf8');
const section = source.match(/const handlers:[\s\S]*?= \{([\s\S]*?)\n\};/);
const handlerKeys = new Set();
if (section) {
  const re = /(?:^|\n)\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_-]+))\s*:/g;
  let m;
  while ((m = re.exec(section[1]))) handlerKeys.add(m[1] || m[2] || m[3]);
}

function slugOf(e) {
  const raw = String(e?.id || e?.slug || e?.url || e?.title || '').trim().toLowerCase();
  const fromUrl = raw.match(/\/([^/?#]+)\/?(?:\?.*)?$/)?.[1] || raw;
  return fromUrl.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-calculator$/, '');
}
function sample(name, i) {
  const n = String(name).toLowerCase();
  if (n === 'values' || n === 'weights' || n.endsWith('values')) return [2, 3, 5];
  if (n.includes('date') || n.includes('birthday')) return '2020-01-01';
  if (n === 'sex' || n === 'gender') return 'male';
  if (n.includes('unit') || n === 'system') return 'metric';
  if (n.includes('type') || n.includes('method') || n.includes('mode')) return 'standard';
  if (n.includes('percent') || n.includes('rate')) return 10;
  if (n.includes('angle')) return 30;
  if (n === 'decimalplaces' || n === 'figures' || n === 'index') return 2;
  if (n === 'people' || n === 'periods' || n === 'years' || n === 'months' || n === 'weeksperyear') return 2;
  return 2 + i;
}
function inputsFor(spec) {
  const out = Object.fromEntries(spec.inputs.map((k, i) => [k, sample(k, i)]));
  if (spec.slug === 'ohms-law') delete out.resistance;
  if (spec.slug === 'age' || spec.slug === 'date-difference') {
    if ('birthDate' in out) out.birthDate = '2000-01-01';
    if ('targetDate' in out) out.targetDate = '2026-01-01';
  }
  return out;
}

const results = [];
for (const entry of entries) {
  const slug = slugOf(entry);
  if (!slug) { results.push({ id: entry?.id ?? null, status: 'INVALID_CATALOG_ENTRY' }); continue; }
  const spec = specs.get(slug);
  if (!handlerKeys.has(slug)) { results.push({ id: entry?.id ?? null, slug, category: entry?.category ?? null, status: 'MISSING_HANDLER' }); continue; }
  if (!spec) { results.push({ id: entry?.id ?? null, slug, category: entry?.category ?? null, status: 'MISSING_SPEC' }); continue; }
  const inputs = inputsFor(spec);
  try {
    const output = engine.calculate(slug, inputs);
    const bad = Object.values(output || {}).some(v => typeof v === 'number' && !Number.isFinite(v));
    results.push({ id: entry?.id ?? null, slug, category: entry?.category ?? null, status: bad ? 'NON_FINITE_RESULT' : 'EXECUTION_PASS', inputs, output });
  } catch (error) {
    results.push({ id: entry?.id ?? null, slug, category: entry?.category ?? null, status: 'EXECUTION_ERROR', error: String(error?.message || error) });
  }
}

const counts = {};
for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
const report = {
  generatedAt: new Date().toISOString(),
  catalogTotalDeclared: Number(catalog.totalCount),
  catalogEntriesAudited: entries.length,
  specCount: specs.size,
  handlerCountDetected: handlerKeys.size,
  counts,
  note: 'Execution pass means the real exported calculator-engine handler was invoked with deterministic synthetic inputs and returned finite output. Domain-specific golden vectors are still recommended for formulas requiring nuanced inputs.',
  results,
};
fs.writeFileSync(path.join(ROOT, 'audit-3728-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
if (entries.length !== Number(catalog.totalCount)) process.exitCode = 2;
