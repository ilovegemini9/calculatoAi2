/**
 * Conservative indexation gate for calculator pages.
 *
 * Keep this decision separate from rendering so future bulk imports cannot
 * accidentally make incomplete/dynamic records indexable. A calculator is
 * indexable only when it has a stable slug, name, description and at least
 * one usable calculation surface (static renderer or dynamic inputs/outputs).
 */
export interface IndexabilityInput {
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  hasStaticRenderer?: boolean;
  hasDynamicSpec?: boolean;
  inputCount?: number;
  outputCount?: number;
  status?: string | null;
}

export interface IndexabilityDecision {
  index: boolean;
  reasons: string[];
}

export function getIndexability(input: IndexabilityInput): IndexabilityDecision {
  const reasons: string[] = [];

  if (!input.slug?.trim()) reasons.push('missing-slug');
  if (!input.name?.trim()) reasons.push('missing-name');
  if (!input.description?.trim() || input.description.trim().length < 40) reasons.push('thin-description');
  if (input.status && input.status !== 'active') reasons.push('inactive');

  const hasStatic = input.hasStaticRenderer === true;
  const hasDynamic = input.hasDynamicSpec === true && (input.inputCount ?? 0) > 0 && (input.outputCount ?? 0) > 0;
  if (!hasStatic && !hasDynamic) reasons.push('no-calculation-surface');

  return { index: reasons.length === 0, reasons };
}
