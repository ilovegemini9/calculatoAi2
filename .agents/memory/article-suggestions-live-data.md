---
name: Article suggestions live-data rule
description: Rules for live search-informed article title and keyword suggestions
---

Article title and keyword suggestions may use live autocomplete/search signals plus a configured AI provider, but must not fabricate search volume, competition, difficulty, CTR, or opportunity scores. If live data or the provider is unavailable, show “Live keyword data unavailable.”

Configured AI model names can become stale and return provider errors, so server-side suggestion calls should try the configured default, fallback, and known compatible models in order.

**Why:** Trust-critical editorial decisions should never be based on invented metrics, and a stale model setting should not make the whole manager unusable.

**How to apply:** Keep metric-bearing APIs live-data-only and give every configurable AI route a bounded model fallback chain.