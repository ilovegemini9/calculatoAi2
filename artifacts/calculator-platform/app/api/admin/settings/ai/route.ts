import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getDb, saveDb } from '@/lib/db';
import { getSetting, setSetting } from '@/lib/pg-settings';
import {
  encryptSerpApiKey,
  getAiProviderKey,
  getAiSettings,
  getPublicAiSettings,
  getSerpApiKey,
  recordAiUsage,
  resetUsagePeriodIfNeeded,
  sanitizeProviderSettings,
} from '@/lib/ai';
import type { AiProvider, AiProviderSettings, AiSettings } from '@/lib/types';

const PG_AI_KEY = 'ai_settings';
const PG_SERP_KEY = 'serp_api_key_encrypted';

const providers: AiProvider[] = ['openrouter', 'openai', 'gemini', 'anthropic'];

function isProvider(value: unknown): value is AiProvider {
  return typeof value === 'string' && providers.includes(value as AiProvider);
}

function publicResponse(settings: AiSettings, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ai: getPublicAiSettings(settings), ...extra });
}

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();

    // Prefer PostgreSQL-persisted settings when available
    const pgAi = await getSetting<typeof db.settings.ai>(PG_AI_KEY);
    const pgSerpEncrypted = await getSetting<string>(PG_SERP_KEY);

    if (pgAi) db.settings.ai = pgAi;
    if (pgSerpEncrypted) db.settings.serpApiKeyEncrypted = pgSerpEncrypted;

    const settings = resetUsagePeriodIfNeeded(getAiSettings(db.settings.ai, db.settings.openrouterApiKey));
    db.settings.ai = settings;
    saveDb(db);

    // Only write usage-counter updates back to PostgreSQL when we successfully
    // read from it first. Writing when pgAi is null would silently overwrite a
    // valid encrypted key with empty defaults on a transient DB failure.
    if (pgAi !== null) {
      await setSetting(PG_AI_KEY, settings);
    }

    return publicResponse(settings, {
      serpApiKeyConfigured: Boolean(getSerpApiKey(db.settings)),
    });
  } catch (err) {
    console.error('[API ERROR - GET /api/admin/settings/ai]:', err);
    return NextResponse.json({ error: 'Failed to load AI settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const payload = (await req.json()) as {
      activeProvider?: AiProvider;
      providers?: Partial<Record<AiProvider, Partial<AiProviderSettings> & { apiKey?: string }>>;
      action?: 'save' | 'test' | 'reset-cache';
      provider?: AiProvider;
      serpApiKey?: string;
    };
    const db = getDb();
    let settings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);

    // Merge in PostgreSQL-persisted settings so we never overwrite with stale json
    const pgAiOnPost = await getSetting<typeof db.settings.ai>(PG_AI_KEY);
    const pgSerpOnPost = await getSetting<string>(PG_SERP_KEY);
    if (pgAiOnPost) db.settings.ai = pgAiOnPost;
    if (pgSerpOnPost) db.settings.serpApiKeyEncrypted = pgSerpOnPost;
    // Re-derive settings after merging
    settings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);

    if (payload.action === 'reset-cache') {
      settings = {
        ...settings,
        usage: { ...settings.usage, cacheVersion: settings.usage.cacheVersion + 1 },
      };
      db.settings.ai = settings;
      saveDb(db);
      await setSetting(PG_AI_KEY, settings);
      return publicResponse(settings, {
        message: 'AI cache reset.',
        serpApiKeyConfigured: Boolean(getSerpApiKey(db.settings)),
      });
    }

    const nextProviders = { ...settings.providers };
    for (const provider of providers) {
      const incoming = payload.providers?.[provider];
      if (incoming) nextProviders[provider] = sanitizeProviderSettings(nextProviders[provider], incoming);
    }
    settings = {
      ...settings,
      activeProvider: isProvider(payload.activeProvider) ? payload.activeProvider : settings.activeProvider,
      providers: nextProviders,
    };

    // Handle SerpAPI key
    if (typeof payload.serpApiKey === 'string' && payload.serpApiKey.trim()) {
      db.settings.serpApiKeyEncrypted = encryptSerpApiKey(payload.serpApiKey.trim());
      await setSetting(PG_SERP_KEY, db.settings.serpApiKeyEncrypted);
    }

    if (payload.action === 'test') {
      const provider = isProvider(payload.provider) ? payload.provider : settings.activeProvider;
      const result = await testProvider(
        { ...settings, providers: nextProviders },
        provider,
      );
      if (!result.ok) return publicResponse(settings, {
        success: false,
        error: result.error,
          serpApiKeyConfigured: Boolean(getSerpApiKey(db.settings)),
      });
      db.settings.ai = recordAiUsage(settings, result.tokens);
      saveDb(db);
      await setSetting(PG_AI_KEY, db.settings.ai);
      return publicResponse(db.settings.ai, {
        success: true,
        message: `${providerLabel(provider)} connection successful.`,
        serpApiKeyConfigured: Boolean(getSerpApiKey(db.settings)),
      });
    }

    db.settings.ai = settings;
    saveDb(db);
    await setSetting(PG_AI_KEY, settings);
    return publicResponse(settings, {
      success: true,
      message: 'AI settings saved securely to PostgreSQL.',
      serpApiKeyConfigured: Boolean(getSerpApiKey(db.settings)),
    });
  } catch (error) {
    console.error('Save AI settings error:', error);
    return NextResponse.json({ error: 'Unable to save AI settings.' }, { status: 500 });
  }
}

function providerLabel(provider: AiProvider) {
  return provider === 'openrouter'
    ? 'OpenRouter'
    : provider === 'openai'
      ? 'OpenAI'
      : provider === 'gemini'
        ? 'Gemini'
        : 'Anthropic';
}

async function testProvider(settings: AiSettings, provider: AiProvider): Promise<{ ok: boolean; error?: string; tokens?: number }> {
  const config = settings.providers[provider];
  const key = getAiProviderKey(settings, provider);
  if (!config.enabled) return { ok: false, error: `${providerLabel(provider)} is disabled.` };
  if (!key) return { ok: false, error: `No API key is configured for ${providerLabel(provider)}.` };

  try {
    if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.defaultModel)}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with OK.' }] }], generationConfig: { temperature: 0, maxOutputTokens: 1 } }),
      });
      if (!response.ok) return { ok: false, error: await providerError(response, providerLabel(provider)) };
      return { ok: true, tokens: 1 };
    }

    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: config.defaultModel, max_tokens: 1, temperature: 0, messages: [{ role: 'user', content: 'Reply with OK.' }] }),
      });
      if (!response.ok) return { ok: false, error: await providerError(response, providerLabel(provider)) };
      const data = await response.json() as { usage?: { output_tokens?: number } };
      return { ok: true, tokens: data.usage?.output_tokens ?? 1 };
    }

    const endpoint = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: config.defaultModel, temperature: 0, max_tokens: 1, messages: [{ role: 'user', content: 'Reply with OK.' }] }),
    });
    if (!response.ok) return { ok: false, error: await providerError(response, providerLabel(provider)) };
    const data = await response.json() as { usage?: { total_tokens?: number } };
    return { ok: true, tokens: data.usage?.total_tokens ?? 1 };
  } catch {
    return { ok: false, error: `${providerLabel(provider)} could not be reached.` };
  }
}

async function providerError(response: Response, label: string) {
  let detail = '';
  try {
    const body = await response.json() as { error?: { message?: string } | string };
    detail = typeof body.error === 'string' ? body.error : body.error?.message ?? '';
  } catch {
    // Keep provider failures generic if the response is not JSON.
  }
  return detail ? `${label}: ${detail.slice(0, 240)}` : `${label} returned HTTP ${response.status}.`;
}