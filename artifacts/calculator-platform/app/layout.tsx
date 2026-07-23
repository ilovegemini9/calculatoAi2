import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getDb } from '@/lib/db';
import { getSeoSettings, parseSeoJsonLd } from '@/lib/seo';
import { getAdsSettings } from '@/lib/ads';
import { getVerificationSettings, parseCustomMetaTags } from '@/lib/verification';
import { AdSlot } from '@/components/ads/AdSlot';

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
  const verification = getVerificationSettings(getDb().settings.verification);
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
    verification: verification.googleSearchConsole.enabled && verification.googleSearchConsole.verificationCode
      ? { google: verification.googleSearchConsole.verificationCode }
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
  const db = getDb();
  const seo = getSeoSettings(db.settings.seo);
  const ads = getAdsSettings(db.settings.ads);
  const verification = getVerificationSettings(db.settings.verification);
  const customMetaTags = parseCustomMetaTags(verification.customMetaTags);
  let jsonLd: unknown = null;
  try {
    jsonLd = parseSeoJsonLd(seo.jsonLd);
  } catch {
    jsonLd = null;
  }
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {verification.googleAdsense.enabled && verification.googleAdsense.verificationCode && (
          <meta name="google-adsense-account" content={verification.googleAdsense.verificationCode} />
        )}
        {verification.bing.enabled && verification.bing.verificationCode && (
          <meta name="msvalidate.01" content={verification.bing.verificationCode} />
        )}
        {verification.yandex.enabled && verification.yandex.verificationCode && (
          <meta name="yandex-verification" content={verification.yandex.verificationCode} />
        )}
        {customMetaTags.map((tag, index) => (
          <meta key={`${tag.name ?? tag.property}-${index}`} name={tag.name} property={tag.property} content={tag.content} />
        ))}
        {ads.enabled && ads.provider === 'adsense' && ads.publisherId && (
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" />
        )}
      </head>
      <body className="min-h-screen font-sans antialiased flex flex-col" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <Header />
          <AdSlot placement="header" ads={ads} />
          <main className="flex-1" id="main-content">
            {jsonLdString && (
              <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
            )}
            {children}
          </main>
          <AdSlot placement="footer" ads={ads} />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
