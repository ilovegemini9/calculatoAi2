# Calculator Platform

A world-class free online calculator platform built with Next.js 15, TypeScript, and Tailwind CSS 4.

## Stack

- **Framework**: Next.js 15 (App Router, SSG)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui conventions
- **Deployment**: Vercel-compatible (standalone output)
- **Monorepo**: pnpm workspaces

## Running locally

```bash
pnpm install
pnpm --filter @workspace/calculator-platform run dev
```

The app runs at `http://localhost:23007`.

## Project structure

```
artifacts/calculator-platform/
  app/                    # Next.js App Router pages
    layout.tsx            # Root layout with metadata
    page.tsx              # Home page (calculator grid)
    globals.css           # Tailwind + custom styles
    calculators/[slug]/   # Individual calculator pages (SSG)
  components/
    layout/               # Header, Footer
    calculators/          # Calculator widgets (client components)
  lib/
    calculators/          # Pure formula logic (unchanged from Vite)
      age/formula.ts
      bmi/formula.ts
      calorie/formula.ts
      gpa/formula.ts
      loan/formula.ts
      mortgage/formula.ts
      percentage/formula.ts
      tip/formula.ts
    types.ts              # Shared TypeScript types
    utils.ts              # cn(), formatCurrency(), etc.
    security.ts           # AI-generated code validator
  config/
    site.ts               # Site-wide constants (name, URL, OG image)
    calculators.ts        # Calculator registry (slug → metadata)
  _legacy/                # Original Vite source (preserved, not compiled)
```

## Calculators

| Slug | Category | Formula |
|------|----------|---------|
| age | Lifestyle | Exact age in years/months/days + next birthday |
| bmi | Fitness | BMI with metric/imperial + health category |
| calorie | Fitness | Mifflin-St Jeor BMR/TDEE + goal table |
| gpa | Math | Weighted/unweighted GPA on 4.0 scale |
| loan | Financial | Amortization schedule + total interest |
| mortgage | Financial | PITI breakdown + full amortization |
| percentage | Math | Percent of, what %, percent change |
| tip | Lifestyle | Tip + bill split calculator |

## Development phases (master plan)

- [x] **Phase 1** — Next.js migration + project cleanup
- [x] **Phase 2** — SEO foundation (robots.txt, sitemap, JSON-LD schemas)
- [x] **Phase 3** — UI/UX redesign (dark mode, animations, premium look)
- [ ] **Phase 4** — Calculator engine (history, share, favorites)
- [ ] **Phase 5** — Rich content pages (1200+ words per calculator)
- [ ] **Phase 6** — Authority pages (About, Privacy, Terms, etc.)
- [ ] **Phase 7** — Blog system (Markdown, categories, tags)
- [ ] **Phase 8** — Admin panel (dashboard, CMS, auth)
- [ ] **Phase 9** — Performance (Lighthouse 100)
- [ ] **Phase 10** — AI SEO (llms.txt, structured data)
- [ ] **Phase 11** — Security (CSP, rate limiting, headers)
- [ ] **Phase 12** — Scalability (500+ calculators)

## User preferences

- Migrate carefully and incrementally — preserve all existing calculator logic
- One phase at a time — user reviews each phase before continuing
- Maintain full Vercel compatibility throughout
- Never rewrite calculator formulas from scratch
