/**
 * Vercel serverless entry point for the Express Calculator Platform API.
 *
 * Durable article automation is intercepted here so queued jobs are persisted
 * in Postgres and processed by Vercel Cron instead of a fire-and-forget
 * in-memory background task.
 */
let appPromise;
let automationPromise;

function getApp() {
  if (!appPromise) {
    appPromise = import('../artifacts/api-server/dist/app-vercel.mjs').then((m) => m.default);
  }
  return appPromise;
}

function getAutomation() {
  if (!automationPromise) {
    automationPromise = import('./automation.js');
  }
  return automationPromise;
}

function normalizePath(req) {
  const raw = String(req.url || '').split('?')[0];
  return raw.startsWith('/api/') ? raw.slice('/api'.length) : raw;
}

export default async function handler(req, res) {
  const pathname = normalizePath(req);
  const automation = await getAutomation();
  const handled = await automation.handle(req, res, pathname);
  if (handled !== false) return;

  const app = await getApp();
  return app(req, res);
}
