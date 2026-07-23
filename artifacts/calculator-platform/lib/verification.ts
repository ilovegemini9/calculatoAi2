import type { VerificationSettings } from './types';

export const DEFAULT_VERIFICATION_SETTINGS: VerificationSettings = {
  googleSearchConsole: { enabled: false, propertyUrl: '', verificationCode: '' },
  googleAdsense: { enabled: false, publisherId: '', verificationCode: '' },
  bing: { enabled: false, verificationCode: '' },
  yandex: { enabled: false, verificationCode: '' },
  customMetaTags: '',
};

export function getVerificationSettings(
  raw?: Partial<VerificationSettings> | null,
): VerificationSettings {
  return {
    ...DEFAULT_VERIFICATION_SETTINGS,
    ...raw,
    googleSearchConsole: {
      ...DEFAULT_VERIFICATION_SETTINGS.googleSearchConsole,
      ...(raw?.googleSearchConsole ?? {}),
    },
    googleAdsense: {
      ...DEFAULT_VERIFICATION_SETTINGS.googleAdsense,
      ...(raw?.googleAdsense ?? {}),
    },
    bing: { ...DEFAULT_VERIFICATION_SETTINGS.bing, ...(raw?.bing ?? {}) },
    yandex: { ...DEFAULT_VERIFICATION_SETTINGS.yandex, ...(raw?.yandex ?? {}) },
  };
}

export function parseCustomMetaTags(raw: string): Array<{ name?: string; property?: string; content: string }> {
  const tags: Array<{ name?: string; property?: string; content: string }> = [];
  const metaPattern = /<meta\b[^>]*>/gi;
  const attributePattern = /([a-zA-Z:-]+)\s*=\s*["']([^"']*)["']/g;

  for (const tag of raw.match(metaPattern) ?? []) {
    const attributes: Record<string, string> = {};
    for (const match of tag.matchAll(attributePattern)) attributes[match[1].toLowerCase()] = match[2];
    if (attributes.content && (attributes.name || attributes.property)) {
      tags.push({
        name: attributes.name,
        property: attributes.property,
        content: attributes.content,
      });
    }
  }
  return tags;
}