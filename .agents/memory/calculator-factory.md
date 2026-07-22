---
name: Calculator Factory architecture
description: How the AI Calculator Factory feature works — generation stages, test gating, and enable flow
---

# Calculator Factory Architecture

## Two-stage AI generation
Stage 1: Full spec (name, slug, inputs, outputs, calculateBody, formula, examples, FAQ, HowTo, SEO, internalLinks) via one OpenRouter call.
Stage 2: Tests (unit, edge, formula) generated separately after Stage 1 — the AI needs to know what the formula actually produces to write correct expected outputs.

**Why:** Splitting stages dramatically improves test quality; tests generated blind from a prompt alone tend to have wrong expected values.

**How to apply:** /api/admin/factory/generate/route.ts runs Stage 1, passes calculateBody as context to Stage 2.

## Test gating
- Calculators always saved with status: 'inactive'
- /api/admin/factory/enable/route.ts rejects PATCH unless metadata.testStatus === 'passed'
- Test runner (/api/admin/factory/test/route.ts) uses new Function() server-side, same pattern as DynamicCalculator on the client
- Relative tolerance 1% for numeric comparisons (tolerance: 0.01)
- Test results persisted to db.calculators[i].metadata.testResults after each run

**Why:** Prevents broken calculators from going live and damaging site credibility.

## Keyword research
- /api/admin/factory/keywords/route.ts — adapted from articles/keywords, focused on "X calculator" search patterns
- Returns: keyword, calculatorName, category, searchVolume, competition, trend, opportunityScore, estimatedTraffic
- Falls back to scored heuristic suggestions when no OpenRouter key is configured

## Dynamic calculator page gating
- [calculatorSlug]/page.tsx filters db.calculators with c.status === 'active' — inactive calcs 404
- formula and examples from metadata now mapped to CalcContent so the page renders them
