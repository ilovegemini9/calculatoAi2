import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getDb } from '@/lib/db';
import { getSeoSettings, parseSeoJsonLd } from '@/lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = getSeoSettings(getDb().settings.seo);
  return {
    metadataBase: new URL(seo.canonicalUrl || siteConfig.url),
    title: {
      default: seo.metaTitle,
      template: `%s | ${siteConfig.name}`,
    },
    description: seo.metaDescription,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name, url: seo.canonicalUrl || siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: seo.openGraph.type,
      locale: 'en_US',
      url: seo.canonicalUrl || siteConfig.url,
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      siteName: siteConfig.name,
      images: [{ url: seo.openGraph.image, width: 1200, height: 630, alt: seo.openGraph.title }],
    },
    twitter: {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: [seo.twitter.image],
    },
    robots: {
      index: seo.robots.enabled,
      follow: seo.robots.enabled,
      googleBot: { index: seo.robots.enabled, follow: seo.robots.enabled, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
      canonical: seo.canonicalUrl || siteConfig.url,
      types: seo.rss.enabled ? { 'application/rss+xml': `${seo.canonicalUrl || siteConfig.url}/rss.xml` } : undefined,
    },
    verification: seo.googleSearchConsole.verificationCode
      ? { google: seo.googleSearchConsole.verificationCode }
      : undefined,
    icons: {
      icon: '/icon.svg',
      apple: '/apple-icon.svg',
    },
    category: 'utility',
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0066cc' },
    { media: '(prefers-color-scheme: dark)',  color: '#0b2545' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const seo = getSeoSettings(getDb().settings.seo);
  let jsonLd: unknown = null;
  try {
    jsonLd = parseSeoJsonLd(seo.jsonLd);
  } catch {
    jsonLd = null;
  }
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased flex flex-col" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <Header />
          <main className="flex-1" id="main-content">
            {jsonLdString && (
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
            )}
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
