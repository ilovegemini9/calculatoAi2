---
name: Calculator codegen architecture
description: How the AI calculator generator works — why 3 passes, why the article is plain text not JSON
---

## The rule
The `/api/code-gen/create` endpoint uses three parallel Gemini calls, NOT one giant prompt.

**Why:** A single prompt asking for code + 2000-word article + FAQ + schema inside one JSON object caused free OpenRouter models to output literal `false` (valid JSON, but not an object), and caused Gemini to return malformed JSON due to unescaped newlines/quotes inside long markdown strings embedded in JSON.

**How:**
- Pass 1 (logic): JSON → formulaCode, validationCode, testsCode, meta (inputs, outputs, calculateBody, calculatorName, category, shortDescription). Temperature 0.2.
- Pass 2 (SEO metadata): JSON → seoTitle, seoDescription, seoKeywords, howToUse, faqItems, schemaJsonLd. NO article field. Temperature 0.6.
- Pass 3 (article): Plain text (no responseMimeType constraint) → raw markdown, stored as `seoArticleContent`. Temperature 0.75.

All three run in parallel with `Promise.all` for Gemini. OpenRouter runs sequentially (free tier rate limits).

**Why separate article pass:** Embedding a 2000-word markdown article as a JSON string value causes JSON corruption — Gemini doesn't reliably escape all newlines/quotes in long outputs. Plain text output is perfectly reliable for the article.

**Key:** SEO metadata failure (pass 2) is non-fatal — code falls back to defaults. Article failure (pass 3) is also non-fatal. Only logic failure (pass 1) blocks the response.

**Primary AI:** Gemini 2.5 Flash via GEMINI_API_KEY env var (user's own key). Falls back to OpenRouter (stored in db.json settings.openrouterApiKey).

**Typical time:** 40-50 seconds with Gemini parallel. 90-120s with OpenRouter sequential.

**Why:** Single-pass failed with "AI returned false" — free OpenRouter model returned literal `false` when overwhelmed by huge prompt. Two-pass with SEO article inside JSON failed because Gemini corrupted long markdown strings.
