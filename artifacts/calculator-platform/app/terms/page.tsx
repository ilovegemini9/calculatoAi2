import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of service for ${siteConfig.name}. Free to use, no warranties on calculation accuracy for professional decisions.`,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  const updated = 'July 1, 2025';
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <nav className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
        <Link href="/" className="hover:text-blue-600">Home</Link> / <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Terms of Service</span>
      </nav>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>Terms of Service</h1>
      <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>Last updated: {updated}</p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Acceptance of Terms</h2>
          <p>By using {siteConfig.name}, you agree to these terms. If you disagree, please stop using the site.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Use of the Service</h2>
          <p>{siteConfig.name} is provided free of charge for personal, educational, and informational use. You may not:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Scrape, crawl, or bulk-download content in a way that burdens our infrastructure</li>
            <li>Attempt to reverse-engineer or copy the service for commercial gain</li>
            <li>Use the service in any unlawful manner</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Disclaimer of Warranties</h2>
          <p>
            Calculators on {siteConfig.name} are provided for informational purposes only. Results should
            not be used as a substitute for professional financial, medical, or legal advice. We make no
            warranties about the accuracy of results for any specific situation.
          </p>
          <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Always consult a qualified professional before making important financial, health, or legal decisions.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, {siteConfig.name} is not liable for any damages
            arising from use of this service or reliance on calculation results.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Changes to Terms</h2>
          <p>We may update these terms. Continued use after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Contact</h2>
          <p><Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link> with any questions about these terms.</p>
        </section>
      </div>
    </div>
  );
}
