import type { AdsSettings, AdPlacement, AdSlotSettings } from './types';

export const AD_PLACEMENTS: Array<{ key: AdPlacement; label: string; description: string }> = [
  { key: 'header', label: 'Header', description: 'Below the site navigation.' },
  { key: 'sidebar', label: 'Sidebar', description: 'Beside calculator content on desktop.' },
  { key: 'footer', label: 'Footer', description: 'Above the site footer.' },
  { key: 'inContent', label: 'In Content', description: 'Between the calculator and supporting content.' },
];

const slot = (desktopHeight: number, mobileHeight: number): AdSlotSettings => ({
  enabled: false,
  slotId: '',
  desktopHeight,
  mobileHeight,
});

export const DEFAULT_ADS_SETTINGS: AdsSettings = {
  enabled: false,
  provider: 'adsense',
  publisherId: '',
  customNetworkName: '',
  customNetworkCode: '',
  slots: {
    header: slot(90, 60),
    sidebar: slot(280, 250),
    footer: slot(90, 60),
    inContent: slot(280, 180),
  },
};

export function getAdsSettings(raw?: Partial<AdsSettings> | null): AdsSettings {
  const rawSlots = (raw?.slots ?? {}) as Partial<Record<AdPlacement, Partial<AdSlotSettings>>>;
  return {
    ...DEFAULT_ADS_SETTINGS,
    ...raw,
    slots: {
      header: { ...DEFAULT_ADS_SETTINGS.slots.header, ...(rawSlots.header ?? {}) },
      sidebar: { ...DEFAULT_ADS_SETTINGS.slots.sidebar, ...(rawSlots.sidebar ?? {}) },
      footer: { ...DEFAULT_ADS_SETTINGS.slots.footer, ...(rawSlots.footer ?? {}) },
      inContent: { ...DEFAULT_ADS_SETTINGS.slots.inContent, ...(rawSlots.inContent ?? {}) },
    },
  };
}