'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { AdPlacement, AdsSettings } from '@/lib/types';

export function AdSlot({ placement, ads }: { placement: AdPlacement; ads: AdsSettings }) {
  const pathname = usePathname();
  const slot = ads.slots[placement];

  useEffect(() => {
    if (ads.enabled && slot.enabled && ads.provider === 'adsense' && ads.publisherId && slot.slotId) {
      try {
        ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
      } catch {
        // Ad scripts can be blocked by privacy tools; the reserved slot remains stable.
      }
    }
  }, [ads.enabled, ads.provider, ads.publisherId, slot.enabled, slot.slotId]);

  if (pathname?.startsWith('/admin') || !ads.enabled) return null;
  if (!slot.enabled || (!slot.slotId && !ads.customNetworkCode)) return null;

  return (
    <div
      className="ad-slot relative w-full overflow-hidden"
      data-ad-placement={placement}
      style={{
        minHeight: `clamp(${Math.max(0, slot.mobileHeight)}px, 18vw, ${Math.max(slot.mobileHeight, slot.desktopHeight)}px)`,
      }}
      aria-label="Advertisement"
    >
      {ads.provider === 'adsense' && ads.publisherId && slot.slotId ? (
        <ins
          className="adsbygoogle block"
          style={{ display: 'block', minHeight: `${slot.mobileHeight}px` }}
          data-ad-client={ads.publisherId}
          data-ad-slot={slot.slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: ads.customNetworkCode }} />
      )}
      <style jsx>{`
        .ad-slot {
          min-height: ${slot.mobileHeight}px !important;
          padding: 8px 0;
        }
        @media (min-width: 768px) {
          .ad-slot {
            min-height: ${slot.desktopHeight}px !important;
          }
        }
      `}</style>
    </div>
  );
}