import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact the ${siteConfig.name} team. Report bugs, request calculators, or share feedback.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <nav className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
        <Link href="/" className="hover:text-blue-600">Home</Link> / <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Contact</span>
      </nav>
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>Contact Us</h1>
      <p className="mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Found a bug, have a feature request, or want to suggest a new calculator? We&apos;d love to hear from you.
      </p>

      <div
        className="rounded-2xl border p-8 space-y-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
          <input
            type="text"
            placeholder="Your name"
            className="w-full p-3 rounded-xl focus:border-blue-500 outline-none transition text-sm border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full p-3 rounded-xl focus:border-blue-500 outline-none transition text-sm border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject</label>
          <select
            className="w-full p-3 rounded-xl focus:border-blue-500 outline-none transition text-sm cursor-pointer border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option>Bug report</option>
            <option>Calculator request</option>
            <option>Accuracy concern</option>
            <option>General feedback</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Message</label>
          <textarea
            rows={5}
            placeholder="Tell us what's on your mind..."
            className="w-full p-3 rounded-xl focus:border-blue-500 outline-none transition text-sm resize-none border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <button
          type="button"
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition text-sm"
        >
          Send Message
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>We typically respond within 1–2 business days.</p>
      </div>
    </div>
  );
}
