import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { getDb } from '@/lib/db';
import { siteConfig } from '@/config/site';
import { getSeoSettings } from '@/lib/seo';
import { breadcrumbSchema } from '@/lib/schemas';
import type { Article } from '@/lib/types';

export const revalidate = 0;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  let base = siteConfig.url;
  try {
    const seo = getSeoSettings(getDb().settings.seo);
    base = seo.canonicalUrl?.replace(/\/$/, '') || siteConfig.url;
  } catch { /* fallback */ }

  const title = 'Blog';
  const description = `Expert guides, tips, and insights on finance, health, math, and everyday calculations from ${siteConfig.name}.`;
  const url = `${base}/blog`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title: `${title} | ${siteConfig.name}`,
      description,
      siteName: siteConfig.name,
      images: [{ url: `${base}/og-image.png`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s\S*$/, '') + '…';
}

function getExcerpt(article: Article): string {
  if (article.seoData?.description) return article.seoData.description;
  return truncate(article.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), 155);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogIndexPage() {
  let articles: Article[] = [];
  let base = siteConfig.url;

  try {
    const db = getDb();
    const seo = getSeoSettings(db.settings.seo);
    base = seo.canonicalUrl?.replace(/\/$/, '') || siteConfig.url;
    articles = db.articles
      .filter((a) => a.status === 'published')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch { /* fallback: empty */ }

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', url: base },
    { name: 'Blog' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-10">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <li><Link href="/" className="hover:text-blue-500 transition">Home</Link></li>
              <li aria-hidden="true" className="opacity-40">/</li>
              <li className="text-[var(--text-secondary)]" aria-current="page">Blog</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Articles &amp; Guides
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Expert insights on finance, health, math, and everyday calculations.
          </p>
        </header>

        {/* Article list */}
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border py-16 text-center" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
            <BookOpen className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-lg font-semibold text-[var(--text-primary)]">No articles yet</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Check back soon — content is on the way.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group rounded-2xl border p-6 transition hover:border-blue-500/40 hover:shadow-sm"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
              >
                {/* Keywords */}
                {(article.seoData?.keywords ?? []).length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {(article.seoData.keywords ?? []).slice(0, 3).map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full border px-2 py-0.5 text-xs text-[var(--text-muted)]"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h2 className="text-xl font-bold leading-snug text-[var(--text-primary)] group-hover:text-blue-500 transition">
                  <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                </h2>

                {/* Excerpt */}
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {getExcerpt(article)}
                </p>

                {/* Meta + CTA */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <time dateTime={article.createdAt}>{formatDate(article.createdAt)}</time>
                    </span>
                    {article.readingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {article.readingTime} min read
                      </span>
                    )}
                    {article.wordCount && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {article.wordCount.toLocaleString()} words
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-400 transition"
                  >
                    Read article <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
