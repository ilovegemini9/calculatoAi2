import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `${siteConfig.name} privacy policy — learn how we handle your data. Spoiler: we don't collect any.`,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  const updated = 'July 1, 2025';
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
        <Link href="/" className="hover:text-blue-600">Home</Link> / <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Privacy Policy</span>
      </nav>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: {updated}</p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>The Short Version</h2>
          <p>
            <strong>We do not collect your data.</strong> All calculations on {siteConfig.name} run
            entirely in your browser. Nothing you type is ever sent to our servers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Information We Do Not Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Calculator inputs or results</li>
            <li>Financial data, health metrics, or personal information you enter</li>
            <li>Browsing history within the site</li>
            <li>Email addresses or account information (we have no accounts)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Information We May Collect</h2>
          <p>Like any website, our hosting provider (Vercel) may log standard server access logs including:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>IP address (anonymized)</li>
            <li>Browser type and version</li>
            <li>Pages visited and timestamps</li>
          </ul>
          <p className="mt-2">These logs are used solely for security and performance monitoring, retained for 30 days, and never sold.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Cookies</h2>
          <p>
            We do not use tracking cookies. We may use strictly necessary cookies (e.g. for future
            preference storage like dark mode) but never for advertising or third-party tracking.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Third-Party Services</h2>
          <p>
            Our site is hosted on Vercel. Their privacy policy is available at{' '}
            <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              vercel.com/legal/privacy-policy
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Contact</h2>
          <p>
            Questions about this policy? <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
