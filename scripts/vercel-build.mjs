import { execFileSync } from 'node:child_process';

// Build the Express API bundle first because api/[...slug].js imports it at
// runtime. Vercel's root build command must produce this artifact on every
// clean deployment, not rely on a previously generated local dist directory.
execFileSync('pnpm', ['--filter', '@workspace/api-server', 'run', 'build:vercel'], { stdio: 'inherit' });

// The calculator platform is self-contained: its public catalog is derived from
// executable engine handlers and registered dedicated renderers. No generated
// metadata-only Omni database is required at build time.
execFileSync('pnpm', ['--filter', '@workspace/calculator-platform', 'build'], { stdio: 'inherit' });
