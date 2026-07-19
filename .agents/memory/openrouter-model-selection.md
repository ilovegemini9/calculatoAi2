---
name: OpenRouter free-model selection for calculator-platform AI features
description: Which free OpenRouter models are used for code-gen vs article-writing in the calculator-platform API server, and why — based on live testing, not just spec sheets.
---

## The rule
Pick free OpenRouter models per task type (structured JSON/code vs long-form prose), not one generic list reused everywhere. Never include a model OpenRouter's `/models` listing flags as "going away soon" — it will start failing in production within days.

**Why:** The most well-known free models (`meta-llama/llama-3.3-70b-instruct:free`, `qwen/qwen3-coder:free`, `google/gemma-4-31b-it:free`, `nousresearch/hermes-3-llama-3.1-405b:free`) are heavily congested — they returned HTTP 429 on most live test attempts. Less "famous" models from NVIDIA (Nemotron 3 family) and Poolside/Cohere coding models responded fast and cleanly and are used as the primary choices instead, with the popular ones kept only as last-resort fallbacks.

**How to apply / current picks (as of July 2026):**
- Structured JSON tasks (calculator formula logic, SEO metadata/briefs) → `nvidia/nemotron-3-super-120b-a12b:free`, `poolside/laguna-m.1:free`, `cohere/north-mini-code:free` (all three produced correct, valid-JSON formulas in testing).
- Long-form article/prose tasks → `nvidia/nemotron-3-ultra-550b-a55b:free` first, `nvidia/nemotron-3-nano-30b-a3b:free` as fast fallback. `openai/gpt-oss-20b:free` was tested and rejected — it produced garbled/non-English artifacts mid-sentence.
- Always verify current OpenRouter model IDs via `GET https://openrouter.ai/api/v1/models` before hardcoding — display names in marketing pages don't map 1:1 to API model IDs (e.g. "Gemma 4 31B" → `google/gemma-4-31b-it:free`, "Laguna M.1" → `poolside/laguna-m.1:free`).
- Excluded on purpose (retiring soon): `tencent/hy3:free`, `qwen/qwen3-next-80b-a3b-instruct:free`.

## Related gotcha: OpenRouter key saved under the wrong secret name
A user pasted an OpenRouter key (`sk-or-...`) into a secret named `OPENAI_API_KEY` instead of `OPENROUTER_API_KEY`. The app's settings loader now falls back to `OPENAI_API_KEY` if `OPENROUTER_API_KEY` is unset (`artifacts/api-server/src/db/db.ts`), and also refuses to let an empty string persisted in `.data/db.json` shadow a newly-added env key on reload.

**Why:** `sk-or-` is a reliable signature for an OpenRouter key regardless of which secret name it's stored under — don't assume the secret name always matches the intended provider.
