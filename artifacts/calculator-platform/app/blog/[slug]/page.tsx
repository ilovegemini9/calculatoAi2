import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, Calendar, ArrowLeft, ExternalLink, BookOpen } from 'lucide-react';
import { getDb } from '@/lib/db';
import { siteConfig } from '@/config/site';
import { getSeoSettings } from '@/lib/seo';
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/schemas';
import type { Article } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveBase(): string {
  try {
    const seo = getSeoSettings(getDb().settings.seo);
    return seo.canonicalUrl?.replace(/\/$/, '') || siteConfig.url.replace(/\/$/, '');
  } catch {
    return siteConfig.url.replace(/\/$/, '');
  }
}

function getArticle(slug: string): Article | undefined {
  try {
    const db = getDb();
    return db.articles.find((a) => a.slug === slug);
  } catch {
    return undefined;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s\S*$/, '') + '…';
}

/** Extract the TOC nav from article HTML if present */
function extractToc(html: string): string {
  const match = html.match(/<nav[^>]*class="[^"]*toc-box[^"]*"[^>]*>[\s\S]*?<\/nav>/i);
  return match?.[0] ?? '';
}

/** Strip the embedded TOC from the article body (we re-render it separately) */
function stripToc(html: string): string {
  return html.replace(/<nav[^>]*class="[^"]*toc-box[^"]*"[^>]*>[\s\S]*?<\/nav>/gi, '');
}

/** Strip <script> tags (JSON-LD injected inline — we re-inject via Next.js) */
function stripScripts(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  const base = resolveBase();
  const url = `${base}/blog/${slug}`;
  const canonicalUrl = article.seoData?.canonicalUrl?.trim()
    ? article.seoData.canonicalUrl
    : url;

  const seoTitle = article.seoData?.title || article.title;
  const metaTitle = `${seoTitle} | ${siteConfig.name}`;
  const metaDescription =
    article.seoData?.description ||
    truncate(stripHtml(article.content), 155);

  const ogTitle = article.openGraph?.title || seoTitle;
  const ogDescription = article.openGraph?.description || metaDescription;
  const ogImage = `${base}/og-image.png`;

  const publishedTime = article.createdAt;
  const modifiedTime = article.updatedAt || article.createdAt;

  return {
    title: seoTitle,
    description: metaDescription,
    keywords: article.seoData?.keywords ?? [],
    authors: [{ name: siteConfig.name, url: base }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: canonicalUrl,
      title: ogTitle,
      description: ogDescription,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
      publishedTime,
      modifiedTime,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    robots: {
      index: article.status === 'published',
      follow: article.status === 'published',
      googleBot: {
        index: article.status === 'published',
        follow: article.status === 'published',
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// ─── JSON-LD builders ─────────────────────────────────────────────────────────

function buildArticleJsonLd(article: Article, base: string): object {
  const url = `${base}/blog/${article.slug}`;
  return articleSchema({
    title: article.seoData?.title || article.title,
    description:
      article.seoData?.description || truncate(stripHtml(article.content), 155),
    url,
    datePublished: article.createdAt,
    dateModified: article.updatedAt || article.createdAt,
  });
}

function buildBreadcrumbJsonLd(article: Article, base: string): object {
  return breadcrumbSchema([
    { name: 'Home', url: base },
    { name: 'Blog', url: `${base}/blog` },
    { name: article.seoData?.title || article.title },
  ]);
}

function buildFaqJsonLd(article: Article): object | null {
  const items = article.faqItems ?? [];
  if (items.length === 0) return null;
  return faqSchema(items.map((f) => ({ question: f.q, answer: f.a })));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) notFound();

  // Only render published articles publicly — drafts stay admin-only
  if (article.status !== 'published') {
    notFound();
  }

  const base = resolveBase();
  const toc = extractToc(article.content);
  const bodyHtml = stripScripts(stripToc(article.content));

  // JSON-LD schemas
  const articleJsonLd = buildArticleJsonLd(article, base);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(article, base);
  const faqJsonLd = buildFaqJsonLd(article);

  // HowTo schema — use stored JSON-LD string if the generator produced it
  let howToJsonLd: object | null = null;
  if (article.schemaHowTo) {
    try { howToJsonLd = JSON.parse(article.schemaHowTo); } catch { /* skip malformed */ }
  }

  const keywords = article.seoData?.keywords ?? [];
  const publishedDate = formatDate(article.createdAt);
  const updatedDate = article.updatedAt ? formatDate(article.updatedAt) : publishedDate;

  return (
    <>
      {/* ── JSON-LD schemas ─────────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {howToJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Breadcrumb nav ───────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <li><Link href="/" className="hover:text-blue-500 transition">Home</Link></li>
            <li aria-hidden="true" className="opacity-40">/</li>
            <li><Link href="/blog" className="hover:text-blue-500 transition">Blog</Link></li>
            <li aria-hidden="true" className="opacity-40">/</li>
            <li className="truncate max-w-[200px] text-[var(--text-secondary)]" aria-current="page">
              {article.seoData?.title || article.title}
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-10">

          {/* ── Main content ─────────────────────────────────────────────── */}
          <article className="min-w-0">

            {/* Header */}
            <header className="mb-8">
              {keywords.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {keywords.slice(0, 4).map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)]"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl">
                {article.title}
              </h1>

              {article.seoData?.description && (
                <p className="mt-3 text-lg leading-relaxed text-[var(--text-muted)]">
                  {article.seoData.description}
                </p>
              )}

              {/* Article meta */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-b py-3 text-sm text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <time dateTime={article.createdAt}>{publishedDate}</time>
                </span>
                {article.updatedAt && article.updatedAt !== article.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs opacity-60">Updated</span>
                    <time dateTime={article.updatedAt}>{updatedDate}</time>
                  </span>
                )}
                {article.readingTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" />
                    {article.readingTime} min read
                  </span>
                )}
                {article.wordCount && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    {article.wordCount.toLocaleString()} words
                  </span>
                )}
              </div>
            </header>

            {/* TOC — mobile (inline, above body) */}
            {toc && (
              <div
                className="lg:hidden mb-8 rounded-xl border p-4 text-sm"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
                dangerouslySetInnerHTML={{ __html: toc }}
              />
            )}

            {/* Article body */}
            <div
              className="article-body prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {/* Back link */}
            <div className="mt-12 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-blue-500 transition"
              >
                <ArrowLeft className="h-4 w-4" /> Back to all articles
              </Link>
            </div>
          </article>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">

              {/* TOC — desktop sidebar */}
              {toc && (
                <div
                  className="rounded-xl border p-4 text-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
                  dangerouslySetInnerHTML={{ __html: toc }}
                />
              )}

              {/* Article info card */}
              <div
                className="rounded-xl border p-4 text-sm space-y-3"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Article info</p>
                <div className="space-y-2 text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                    <span>{publishedDate}</span>
                  </div>
                  {article.readingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                      <span>{article.readingTime} min read</span>
                    </div>
                  )}
                  {article.wordCount && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                      <span>{article.wordCount.toLocaleString()} words</span>
                    </div>
                  )}
                </div>

                {keywords.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] pt-1">Topics</p>
                    <div className="flex flex-wrap gap-1">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full border px-2 py-0.5 text-xs text-[var(--text-muted)]"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>
          </aside>
        </div>
      </div>

      {/* ── Article body styles ───────────────────────────────────────────────── */}
      <style>{`
        .article-body h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 2.5rem 0 1rem;
          color: var(--text-primary);
          scroll-margin-top: 5rem;
        }
        .article-body h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1.75rem 0 0.75rem;
          color: var(--text-primary);
          scroll-margin-top: 5rem;
        }
        .article-body p {
          margin: 0 0 1.25rem;
          line-height: 1.75;
          color: var(--text-secondary);
        }
        .article-body ul, .article-body ol {
          margin: 0 0 1.25rem 1.5rem;
          color: var(--text-secondary);
          line-height: 1.75;
        }
        .article-body li { margin-bottom: 0.375rem; }
        .article-body strong { color: var(--text-primary); font-weight: 600; }
        .article-body em { font-style: italic; }
        .article-body a {
          color: #3b82f6;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .article-body a:hover { color: #2563eb; }
        .article-body a[target="_blank"]::after {
          content: '';
          display: inline-block;
          width: 0.75rem;
          height: 0.75rem;
          margin-left: 0.25rem;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Cpath d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3'/%3E%3C/svg%3E") center/contain no-repeat;
          vertical-align: middle;
          opacity: 0.6;
        }
        .article-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9rem;
          overflow-x: auto;
          display: block;
        }
        .article-body th {
          background: var(--bg-card);
          font-weight: 600;
          text-align: left;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border);
          color: var(--text-primary);
          white-space: nowrap;
        }
        .article-body td {
          padding: 0.5rem 0.875rem;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          vertical-align: top;
        }
        .article-body tr:nth-child(even) td { background: var(--bg-card); }
        .article-body .seo-summary-box {
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 1.25rem 1.5rem;
          background: var(--bg-card);
          margin: 0 0 1.75rem;
        }
        .article-body .seo-summary-box h3 {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #3b82f6;
        }
        .article-body .seo-summary-box ul {
          margin: 0;
          padding-left: 1.25rem;
          list-style: disc;
        }
        .article-body .seo-summary-box li { color: var(--text-secondary); margin-bottom: 0.375rem; }
        .article-body .related-calculator-box { /* styled inline by generator */ }
        .article-body .toc-box { display: none; } /* TOC pulled out and re-placed by page */
        /* Sidebar TOC styles */
        .toc-box { font-size: 0.8125rem; }
        .toc-title {
          font-size: 0.6875rem !important;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-muted) !important;
          margin: 0 0 0.625rem !important;
        }
        .toc-list { list-style: none; padding: 0; margin: 0; }
        .toc-list li { margin-bottom: 0.25rem; }
        .toc-link {
          color: var(--text-secondary) !important;
          text-decoration: none !important;
          display: block;
          padding: 0.125rem 0;
          line-height: 1.4;
          transition: color 0.15s;
        }
        .toc-link:hover { color: #3b82f6 !important; }
        .ml-4 { margin-left: 1rem; }
      `}</style>
    </>
  );
}
