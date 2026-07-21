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

  // 301 redirects
  async redirects() {
    return [
      // /calculator/:slug → /:slug-calculator  (legacy nested path)
      {
        source: '/calculator/:slug',
        destination: '/:slug-calculator',
        permanent: true,
      },
      // /calculators/:slug → /:slug-calculator  (legacy plural path)
      {
        source: '/calculators/:slug',
        destination: '/:slug-calculator',
        permanent: true,
      },
      // Strip .html from single-segment paths: /mortgage-calculator.html → /mortgage-calculator
      {
        source: '/:slug.html',
        destination: '/:slug',
        permanent: true,
      },
      // Strip .html from nested paths: /blog/post-title.html → /blog/post-title
      {
        source: '/:first/:rest*.html',
        destination: '/:first/:rest*',
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
