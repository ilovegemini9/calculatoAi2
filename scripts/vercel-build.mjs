import { execFileSync } from 'node:child_process';

// Build the Express API bundle first because the Vercel catch-all serverless
// entry imports artifacts/api-server/dist/app-vercel.mjs at runtime.
execFileSync('pnpm', ['--filter', '@workspace/api-server', 'run', 'build:vercel'], { stdio: 'inherit' });

// The calculator platform is self-contained: its public catalog is derived from
// executable engine handlers and registered dedicated renderers. No generated
// metadata-only Omni database is required at build time.
execFileSync('pnpm', ['--filter', '@workspace/calculator-platform', 'build'], { stdio: 'inherit' });
