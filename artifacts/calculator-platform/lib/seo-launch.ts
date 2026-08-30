import { getTrafficPriority } from './seo-priority';

export type CalculatorLaunchState = {
  implemented: boolean;
  validated: boolean;
};

/** Only implemented + validated calculators should be indexable. */
export function getSeoLaunchState(slug: string, state: CalculatorLaunchState) {
  const priority = getTrafficPriority(slug);
  const indexable = state.implemented && state.validated;

  return {
    indexable,
    priority: priority?.priority ?? 'P2',
    cluster: priority?.cluster ?? 'general',
    variants: priority?.variants ?? [],
  } as const;
}
