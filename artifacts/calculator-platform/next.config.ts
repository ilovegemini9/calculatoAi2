import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Point file-tracing at the monorepo root so Next.js resolves shared
  // packages (lib/*, node_modules) correctly during builds and deploys.
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Experimental features
  experimental: {
    cpus: 1,
    // Disable the webpack build worker — it spawns a separate process that
    // cannot share the monorepo's module resolution context, which causes
    // "Cannot find module './NNNN.js'" chunk errors on Replit's FS.
    webpackBuildWorker: false,
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
      // Prevent any CDN / Vercel edge from caching admin pages or API responses
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        source: '/api/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      // Ensure Google treats the sitemap as XML, not HTML
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400' },
        ],
      },
      // Global security headers
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
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

  // TypeScript and ESLint (checked separately via lint/typecheck tasks)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
