import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Isolate dev build from production build — prevents chunk corruption when
  // `next build` and `next dev` share the same .next directory on Replit.
  // next dev  → NODE_ENV=development → /tmp/.next-calculator (ephemeral, safe)
  // next build → NODE_ENV=production  → .next (normal, committed for Vercel)
  distDir: process.env.NODE_ENV === 'development' ? '/tmp/.next-calculator' : '.next',

  // Allow Replit's proxied dev domain for cross-origin HMR/RSC requests
  allowedDevOrigins: ['*.replit.dev', '*.spock.replit.dev', '*.repl.co'],

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

  // Disable webpack filesystem cache in dev — prevents corrupt .next/cache on Replit's FS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { dev }: { dev: boolean }) {
    if (dev) {
      config.cache = false;
    }
    return config;
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
