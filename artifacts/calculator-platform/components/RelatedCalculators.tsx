import Link from 'next/link';
import { CATEGORY_COLORS, CATEGORY_LABELS, type CalculatorMeta } from '@/config/calculators';

/**
 * Score a candidate calculator's relevance to the current one.
 * Same category = strong signal (10 pts); keyword overlap adds additional points.
 */
function relevanceScore(current: CalculatorMeta, candidate: CalculatorMeta): number {
  const currentKeywords = new Set(current.keywords.map((k) => k.toLowerCase()));
  const overlap = candidate.keywords.filter((k) =>
    currentKeywords.has(k.toLowerCase()),
  ).length;
  const categoryBonus = candidate.category === current.category ? 10 : 0;
  return categoryBonus + overlap;
}

/**
 * Return up to `maxCount` related calculators for the given calculator.
 * Prioritises same-category matches, then fills remaining slots with
 * cross-category calculators that share the most keywords.
 */
export function getRelatedCalculators(
  current: CalculatorMeta,
  all: CalculatorMeta[],
  maxCount = 6,
): CalculatorMeta[] {
  return all
    .filter((c) => c.slug !== current.slug)
    .map((c) => ({ calc: c, score: relevanceScore(current, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map((s) => s.calc);
}

interface RelatedCalculatorsProps {
  related: CalculatorMeta[];
}

export function RelatedCalculators({ related }: RelatedCalculatorsProps) {
  if (related.length === 0) return null;

  return (
    <section
      aria-label="Related Calculators"
      className="border-t py-10 px-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-xs font-black uppercase tracking-widest mb-5"
          style={{ color: 'var(--text-muted)' }}
        >
          Related Calculators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {related.map((r) => {
            const colors = CATEGORY_COLORS[r.category] ?? {
              bg: 'bg-blue-50 dark:bg-blue-950/40',
              text: 'text-blue-700 dark:text-blue-400',
              border: '',
            };
            return (
              <Link
                key={r.slug}
                href={`/${r.slug}-calculator`}
                className="group flex items-center gap-3 p-4 rounded-xl border card-lift transition-all duration-200"
                style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}
              >
                <span
                  className="text-2xl group-hover:scale-110 transition-transform duration-200 shrink-0"
                  aria-hidden="true"
                >
                  {r.icon}
                </span>
                <div className="min-w-0">
                  <p
                    className="font-semibold text-sm group-hover:text-blue-500 transition-colors truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {r.name}
                  </p>
                  <p
                    className="text-[11px] line-clamp-2 mt-0.5 leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {r.description}
                  </p>
                  <span
                    className={`mt-1.5 inline-block text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
                  >
                    {CATEGORY_LABELS[r.category] ?? r.category}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
