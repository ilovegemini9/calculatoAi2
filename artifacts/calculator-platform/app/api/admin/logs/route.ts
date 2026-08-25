export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { getSetting } from '@/lib/pg-settings';
import { verifySession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await getDb();

    // Prefer PostgreSQL-persisted logs so events written in previous serverless
    // invocations (where /tmp is ephemeral) are still visible.
    const pgLogs = await getSetting<typeof db.logs>('platform_logs');
    if (pgLogs && Array.isArray(pgLogs) && pgLogs.length > db.logs.length) {
      db.logs = pgLogs;
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const search = searchParams.get('search')?.toLowerCase();

    let logs = db.logs || [];

    if (level && level !== 'ALL') {
      logs = logs.filter((l) => l.level === level);
    }
    if (search) {
      logs = logs.filter(
        (l) =>
          l.message.toLowerCase().includes(search) ||
          l.route.toLowerCase().includes(search),
      );
    }

    return NextResponse.json(logs);
  } catch (err) {
    console.error('[GET /api/admin/logs] error:', err);
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
  }
}

export async function DELETE() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await getDb();
    db.logs = [];
    await saveDb(db);
    // Also clear from pg-settings
    const { setSetting } = await import('@/lib/pg-settings');
    await setSetting('platform_logs', []).catch(() => { /* ignore */ });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/logs] error:', err);
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
  }
}
