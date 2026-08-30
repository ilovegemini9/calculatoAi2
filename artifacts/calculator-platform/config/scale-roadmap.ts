import { TRAFFIC_PRIORITY } from './traffic-priority';

/**
 * Traffic-first rollout for the free calculator catalog.
 * Catalog entries may be discovered automatically, but a page must remain
 * non-indexable until its calculator implementation and content are verified.
 */
export const SCALE_ROADMAP = {
  targetCatalogSize: 3916,
  free: true,
  duplicatePolicy: 'normalized-slug-and-intent-dedupe',
  indexPolicy: 'implemented-and-validated-only',
  waves: [
    { id: 1, name: 'P0', calculators: TRAFFIC_PRIORITY.filter((x) => x.priority === 'P0').map((x) => x.slug) },
    { id: 2, name: 'P1', calculators: TRAFFIC_PRIORITY.filter((x) => x.priority === 'P1').map((x) => x.slug) },
    { id: 3, name: 'catalog-expansion', calculators: 'remaining-discovered-calculators' },
  ],
} as const;
