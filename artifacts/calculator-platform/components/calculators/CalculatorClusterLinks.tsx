import Link from 'next/link';
import { CALCULATOR_BY_SLUG } from '@/config/calculators';
import { getKeywordClusterId, KEYWORD_CLUSTERS } from '@/config/keyword-clusters';

interface Props {
  slug: string;
}

export function CalculatorClusterLinks({ slug }: Props) {
  const cluster = KEYWORD_CLUSTERS.find((item) => item.id === getKeywordClusterId(slug));
  if (!cluster) return null;

  const links = cluster.routes
    .filter((route) => route !== slug && CALCULATOR_BY_SLUG[route])
    .slice(0, 8)
    .map((route) => ({ slug: route, name: CALCULATOR_BY_SLUG[route].name }));

  if (links.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 pb-8" aria-labelledby="calculator-topic-cluster">
      <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="mb-4">
          <h2 id="calculator-topic-cluster" className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {cluster.label}
          </h2>
          <p className="text-sm leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
            {cluster.description}
          </p>
        </div>
        <nav aria-label={`More ${cluster.label}`} className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.slug}
              href={`/${link.slug}-calculator`}
              className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:border-blue-500 hover:text-blue-500"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
