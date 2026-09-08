import { execFileSync } from 'node:child_process';

// The calculator platform is self-contained: its public catalog is derived from
// executable engine handlers and registered dedicated renderers. No generated
// metadata-only Omni database is required at build time.
execFileSync('pnpm', ['--filter', '@workspace/calculator-platform', 'build'], { stdio: 'inherit' });
