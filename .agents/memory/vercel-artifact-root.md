---
name: Vercel artifact root
description: Deployment path convention for the calculator platform on Vercel
---

The Vercel project is configured with `artifacts/calculator-platform` as its project root. Therefore, Vercel's `outputDirectory` is relative to that root and must be `.next`, not `artifacts/calculator-platform/.next`.

**Why:** Vercel otherwise concatenates both paths and looks for `artifacts/calculator-platform/artifacts/calculator-platform/.next`.

**How to apply:** Keep the build command able to run from the repository workspace, but express Next.js output paths relative to the Vercel project root.