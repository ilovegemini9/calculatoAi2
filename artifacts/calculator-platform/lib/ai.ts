import crypto from 'crypto';
import type {
  AiProvider,
  AiProviderSettings,
  AiSettings,
  AiUsageCounters,
} from './types';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const PROVIDERS: AiProvider[] = ['openrouter', 'openai', 'gemini', 'anthropic'];
const ENCRYPTION_SECRET =
  process.env.AI_ENCRYPTION_KEY ||
  process.env.SESSION_SECRET ||
  'calculator-platform-ai-encryption-key';

const encryptionKey = crypto
  .createHash('sha256')
  .update(ENCRYPTION_SECRET)
  .digest();

const providerDefaults: Record<AiProvider, Omit<AiProviderSettings, 'apiKeyEncrypted'>> = {
  openrouter: {
    enabled: true,
    defaultModel: 'google/gemini-2.0-flash-exp:free',
    fallbackModel: '',
    temperature: 0.7,
    maxTokens: 4096,
    dailyBudget: 0,
    monthlyBudget: 0,
  },
  openai: {
    enabled: false,
    defaultModel: 'gpt-4o-mini',
    fallbackModel: 'gpt-4.1-mini',
    temperature: 0.7,
    maxTokens: 4096,
    dailyBudget: 0,
    monthlyBudget: 0,
  },
  gemini: {
    enabled: false,
    defaultModel: 'gemini-2.0-flash',
    fallbackModel: 'gemini-2.0-flash-lite',
    temperature: 0.7,
    maxTokens: 4096,
    dailyBudget: 0,
    monthlyBudget: 0,
  },
  anthropic: {
    enabled: false,
    defaultModel: 'claude-3-5-haiku-latest',
    fallbackModel: 'claude-3-5-sonnet-latest',
    temperature: 0.7,
    maxTokens: 4096,
    dailyBudget: 0,
    monthlyBudget: 0,
  },
};

const defaultUsage: AiUsageCounters = {
  dailyRequests: 0,
  monthlyRequests: 0,
  dailyTokens: 0,
  monthlyTokens: 0,
  lastDay: '',
  lastMonth: '',
  cacheVersion: 1,
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  activeProvider: 'openrouter',
  providers: Object.fromEntries(
    PROVIDERS.map((provider) => [
      provider,
      { ...providerDefaults[provider], apiKeyEncrypted: '' },
    ]),
  ) as Record<AiProvider, AiProviderSettings>,
  usage: defaultUsage,
};

export function getAiSettings(
  raw?: Partial<AiSettings> | null,
  legacyOpenRouterKey?: string,
): AiSettings {
  const legacyEncrypted = legacyOpenRouterKey?.trim()
    ? encryptApiKey(legacyOpenRouterKey.trim())
    : '';
  const rawProviders = (raw?.providers ?? {}) as Partial<
    Record<AiProvider, Partial<AiProviderSettings>>
  >;
  return {
    ...DEFAULT_AI_SETTINGS,
    ...raw,
    providers: Object.fromEntries(
      PROVIDERS.map((provider) => [
        provider,
        {
          ...DEFAULT_AI_SETTINGS.providers[provider],
          ...(rawProviders[provider] ?? {}),
          ...(provider === 'openrouter' &&
          !rawProviders[provider]?.apiKeyEncrypted &&
          legacyEncrypted
            ? { apiKeyEncrypted: legacyEncrypted }
            : {}),
        },
      ]),
    ) as Record<AiProvider, AiProviderSettings>,
    usage: { ...defaultUsage, ...(raw?.usage ?? {}) },
  };
}

export function encryptApiKey(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptApiKey(value: string): string {
  if (!value) return '';
  const [version, ivEncoded, tagEncoded, encryptedEncoded] = value.split('.');
  if (version !== VERSION || !ivEncoded || !tagEncoded || !encryptedEncoded) return '';
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      encryptionKey,
      Buffer.from(ivEncoded, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return '';
  }
}

export function getAiProviderKey(settings: AiSettings, provider: AiProvider): string {
  return decryptApiKey(settings.providers[provider]?.apiKeyEncrypted ?? '');
}

export function getProviderModels(settings: AiSettings, provider: AiProvider, builtInModels: string[] = []) {
  const config = settings.providers[provider];
  return [...new Set([config.defaultModel, config.fallbackModel, ...builtInModels].filter(Boolean))];
}

export function getPublicAiSettings(settings: AiSettings) {
  return {
    activeProvider: settings.activeProvider,
    providers: Object.fromEntries(
      PROVIDERS.map((provider) => {
        const configured = Boolean(settings.providers[provider]?.apiKeyEncrypted);
        return [
          provider,
          {
            enabled: settings.providers[provider].enabled,
            defaultModel: settings.providers[provider].defaultModel,
            fallbackModel: settings.providers[provider].fallbackModel,
            temperature: settings.providers[provider].temperature,
            maxTokens: settings.providers[provider].maxTokens,
            dailyBudget: settings.providers[provider].dailyBudget,
            monthlyBudget: settings.providers[provider].monthlyBudget,
            apiKeyConfigured: configured,
            apiKeyMasked: configured ? '••••••••••••' : '',
          },
        ];
      }),
    ),
    usage: settings.usage,
  };
}

export function resetUsagePeriodIfNeeded(settings: AiSettings): AiSettings {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  const usage = { ...settings.usage };
  if (usage.lastDay !== day) {
    usage.dailyRequests = 0;
    usage.dailyTokens = 0;
    usage.lastDay = day;
  }
  if (usage.lastMonth !== month) {
    usage.monthlyRequests = 0;
    usage.monthlyTokens = 0;
    usage.lastMonth = month;
  }
  return { ...settings, usage };
}

export function recordAiUsage(settings: AiSettings, tokens = 0): AiSettings {
  const next = resetUsagePeriodIfNeeded(settings);
  return {
    ...next,
    usage: {
      ...next.usage,
      dailyRequests: next.usage.dailyRequests + 1,
      monthlyRequests: next.usage.monthlyRequests + 1,
      dailyTokens: next.usage.dailyTokens + Math.max(0, tokens),
      monthlyTokens: next.usage.monthlyTokens + Math.max(0, tokens),
    },
  };
}

// ─── SerpAPI key helpers ──────────────────────────────────────────────────────

export function getSerpApiKey(settings: { serpApiKeyEncrypted?: string }): string {
  return decryptApiKey(settings.serpApiKeyEncrypted ?? '');
}

export function encryptSerpApiKey(plainKey: string): string {
  return plainKey.trim() ? encryptApiKey(plainKey.trim()) : '';
}

export function sanitizeProviderSettings(
  current: AiProviderSettings,
  incoming: Partial<AiProviderSettings> & { apiKey?: string },
): AiProviderSettings {
  const apiKey = typeof incoming.apiKey === 'string' ? incoming.apiKey.trim() : '';
  return {
    enabled: typeof incoming.enabled === 'boolean' ? incoming.enabled : current.enabled,
    defaultModel: typeof incoming.defaultModel === 'string' ? incoming.defaultModel.trim() : current.defaultModel,
    fallbackModel: typeof incoming.fallbackModel === 'string' ? incoming.fallbackModel.trim() : current.fallbackModel,
    apiKeyEncrypted: apiKey ? encryptApiKey(apiKey) : current.apiKeyEncrypted,
    temperature: Math.max(0, Math.min(2, Number(incoming.temperature ?? current.temperature) || 0)),
    maxTokens: Math.max(1, Math.min(200000, Math.round(Number(incoming.maxTokens ?? current.maxTokens) || 1))),
    dailyBudget: Math.max(0, Number(incoming.dailyBudget ?? current.dailyBudget) || 0),
    monthlyBudget: Math.max(0, Number(incoming.monthlyBudget ?? current.monthlyBudget) || 0),
  };
}