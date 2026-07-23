---
name: Articles Manager 2.0 architecture
description: How the redesigned AI Articles Manager 2.0 is structured — endpoints, SerpAPI key storage, UI flow, and live-data policy.
---

# Articles Manager 2.0 Architecture

## UI flow (artifacts/calculator-platform/app/admin/articles/page.tsx)
Step 1: Enter topic → POST /api/admin/articles/research → returns titleCards + researchSummary
Step 2: Click title card → POST /api/admin/articles/suggest (kind=keywords) → returns keywordChips
Step 3: Click keyword chip → POST /api/admin/articles/outline → returns editable outline sections
Step 4: Edit outline → POST /api/admin/articles/generate → saves article as draft
Step 5: Draft → Pending Review → Published (never auto-published)

## API endpoints
- `POST /api/admin/articles/research` — SerpAPI + free fallback + OpenRouter AI analysis → 5 title cards with metrics
- `POST /api/admin/articles/suggest` — kind=keywords: 5 keyword chips with metrics; kind=slug: AI slug
- `POST /api/admin/articles/outline` — AI outline generation from research + PAA questions
- `POST /api/admin/articles/generate` — existing endpoint, accepts outline array

## SerpAPI key storage
- Stored encrypted in `db.settings.serpApiKeyEncrypted` (same AES-256-GCM as OpenRouter keys)
- Helper: `getSerpApiKey(db.settings)` in `lib/ai.ts`
- Helper: `encryptSerpApiKey(plain)` in `lib/ai.ts`
- Set/saved via POST /api/admin/settings/ai with `{ serpApiKey: "..." }` payload
- Exposed as `serpApiKeyConfigured: boolean` in GET /api/admin/settings/ai response
- UI: Settings → AI Settings → SerpAPI section

## Live data policy
- With SerpAPI: real organic results, PAA, trends → metrics on title/keyword cards
- Without SerpAPI: Google Autocomplete + DuckDuckGo (free) → metrics show null → UI says "Live search data unavailable"
- Opportunity score is always AI-computed (from free signals when no SerpAPI)
- NEVER fabricate search volume, competition, or trend numbers

**Why:** Spec requirement — metrics must come from real data or be marked unavailable.

## Types added (lib/types.ts)
- `ResearchTitleCard`: title, searchVolumeLabel, competition, trend, opportunityScore
- `ResearchKeywordChip`: keyword, searchVolumeLabel, competition, trend
- `ArticleOutlineSection`: id, type (h2/h3/faq/howto/examples/comparison/proscons/internal-links/related), heading, subpoints
- `ArticleResearchSummary`: full research data passed between steps
- `SystemSettings.serpApiKeyEncrypted`: optional encrypted SerpAPI key
