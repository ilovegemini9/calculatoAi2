import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getDb } from '@/lib/db';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const calcs = db.calculators;
  const logs  = db.logs ?? [];

  // ── Factory stats from DB ─────────────────────────────────────────────────
  const totalGenerated   = calcs.length;
  const published        = calcs.filter((c) => c.status === 'active').length;
  const pendingApproval  = calcs.filter((c) => c.status === 'inactive').length;

  // ── Error count from logs (factory-related) ───────────────────────────────
  const factoryErrors = logs.filter(
    (l) =>
      l.level === 'ERROR' &&
      (l.route?.toLowerCase().includes('factory') ||
        l.message?.toLowerCase().includes('generat') ||
        l.message?.toLowerCase().includes('openrouter') ||
        l.message?.toLowerCase().includes('gemini')),
  ).length;

  // ── Recent activity (last 7 days) ─────────────────────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const generatedThisWeek = calcs.filter((c) => c.createdAt >= sevenDaysAgo).length;

  // ── Provider detection ────────────────────────────────────────────────────
  const hasOpenRouterKey = Boolean(db.settings.openrouterApiKey?.trim());
  const hasGeminiEnv     = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenRouterEnv = Boolean(process.env.OPENROUTER_API_KEY);

  const isConnected = hasOpenRouterKey || hasGeminiEnv || hasOpenRouterEnv;
  const provider = hasOpenRouterKey || hasOpenRouterEnv
    ? 'OpenRouter'
    : hasGeminiEnv
    ? 'Google Gemini'
    : null;

  const aiEnabled = db.settings.featureFlags.aiEnabled;

  // ── Recent calculator activity ────────────────────────────────────────────
  const recentActivity = [...calcs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((c) => ({
      name:      c.name,
      slug:      c.slug,
      category:  c.category,
      status:    c.status,
      createdAt: c.createdAt,
    }));

  return NextResponse.json({
    connected:  isConnected,
    aiEnabled,
    provider,
    stats: {
      totalGenerated,
      published,
      pendingApproval,
      failed: factoryErrors,
      generatedThisWeek,
    },
    // Token usage is not tracked server-side — external API dashboard required
    tokenUsage: null,
    recentActivity,
  });
}
