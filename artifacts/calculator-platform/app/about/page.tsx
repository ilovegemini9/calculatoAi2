import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';
import { organizationSchema, articleSchema } from '@/lib/schemas';

export const metadata: Metadata = {
  title: 'About',
  description: `Learn about ${siteConfig.name} — a free, private, and accurate online calculator platform trusted by millions.`,
  alternates: { canonical: '/about' },
  openGraph: {
    title: `About ${siteConfig.name}`,
    description: `Learn about ${siteConfig.name} — a free, private calculator platform.`,
    type: 'website',
  },
};

const publishDate = '2024-01-01T00:00:00Z';
const modifiedDate = new Date().toISOString();

export default function AboutPage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <nav className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:text-blue-500 transition-colors">Home</Link> / <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>About</span>
        </nav>

        <h1 className="text-4xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>About {siteConfig.name}</h1>
        <p className="text-lg leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
          {siteConfig.name} is a free online calculator platform designed to make everyday math simple,
          instant, and completely private.
        </p>

        <section className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <div>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Our Mission</h2>
            <p>
              Everyone deserves access to fast, accurate calculation tools without barriers — no
              subscriptions, no sign-ups, no ads cluttering the page. We built {siteConfig.name} to be
              the calculator you reach for first, every time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Privacy by Design</h2>
            <p>
              Every calculation on {siteConfig.name} happens entirely in your browser. We do not send
              your inputs to any server, we do not store results, and we do not track individual
              calculations. Your financial figures, health metrics, and personal data stay on your device.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Accuracy You Can Trust</h2>
            <p>
              Our formulas are verified against authoritative sources — IRS guidelines for financial
              calculations, WHO standards for health metrics, and standard academic grading scales for
              GPA. Each formula is implemented in TypeScript with unit tests to prevent regressions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Our Calculators</h2>
            <p>
              We currently offer {CALCULATORS.length} free calculators across finance, fitness, math,
              and lifestyle categories:
            </p>
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {CALCULATORS.map((c) => (
                <li key={c.slug} className="flex items-center gap-2">
                  <span>{c.icon}</span>
                  <Link href={`/${c.slug}-calculator`} className="text-blue-600 hover:underline font-medium">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Technology</h2>
            <p>
              {siteConfig.name} is built with Next.js 15, TypeScript, and Tailwind CSS. Pages are
              statically generated for maximum performance and deployed on Vercel&apos;s global edge
              network. Our Lighthouse score targets 100 across Performance, Accessibility, Best
              Practices, and SEO.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Contact</h2>
            <p>
              Have a suggestion, found a bug, or want to request a new calculator?{' '}
              <a href="/contact" className="text-blue-600 hover:underline">Get in touch</a> — we read
              every message.
            </p>
          </div>
        </section>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema({
        title: `About ${siteConfig.name}`,
        description: `Learn about ${siteConfig.name} — a free, private online calculator platform.`,
        url: `${siteConfig.url}/about`,
        datePublished: publishDate,
        dateModified: modifiedDate,
      })) }} />
    </>
  );
}
