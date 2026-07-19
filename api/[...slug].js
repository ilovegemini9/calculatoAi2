/**
 * Vercel serverless entry point — runs the real Calculator Platform Express
 * API in-process on Vercel (no dependency on any external Replit URL).
 *
 * The Express app is built ahead of time by `pnpm --filter @workspace/api-server
 * run build:vercel` (see vercel.json's buildCommand), which bundles
 * artifacts/api-server/src/app.ts into dist/app-vercel.mjs. That app talks to
 * Postgres via DATABASE_URL — set that env var in the Vercel project settings
 * (Settings → Environment Variables) to a Postgres connection string reachable
 * from the public internet (e.g. Neon, Supabase, or Vercel Postgres). This is
 * a one-time setup step, not something that needs to change on every deploy.
 */
let appPromise;

function getApp() {
  if (!appPromise) {
    appPromise = import('../artifacts/api-server/dist/app-vercel.mjs').then((m) => m.default);
  }
  return appPromise;
}

export default async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
