---
name: AI settings security
description: Durable rules for storing, displaying, and consuming configurable AI provider credentials
---

AI provider credentials must be encrypted before persistence, decrypted only inside server-side provider calls, and omitted from every browser-facing response. Admin forms may receive only configured/masked status; a blank key preserves the existing encrypted key.

**Why:** API keys are high-impact secrets, and the existing settings endpoint previously exposed the legacy OpenRouter field.

**How to apply:** Any new provider or AI route should use the centralized AI settings helpers, never read or return raw credential fields, and keep connection tests server-side.