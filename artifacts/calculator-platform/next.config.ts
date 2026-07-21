import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output for optimized deployment
  output: 'standalone',

  // Experimental features
  experimental: {
    // React 19 server actions
    serverActions: {
      allowedOrigins: ['*'],
    },
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },

  // 301 redirects: strip .html extension from any inbound URL
  async redirects() {
    return [
      // /calculator/mortgage.html → /calculator/mortgage
      {
        source: '/calculator/:slug.html',
        destination: '/calculator/:slug',
        permanent: true,
      },
      // /calculators/mortgage.html → /calculator/mortgage (legacy plural form)
      {
        source: '/calculators/:slug.html',
        destination: '/calculator/:slug',
        permanent: true,
      },
      // Catch-all: /about.html, /privacy.html, /terms.html, etc.
      {
        source: '/:slug.html',
        destination: '/:slug',
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
