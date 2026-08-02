export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    return NextResponse.json(db.backups || []);
  } catch (err) {
    console.error('[API ERROR - GET /api/admin/backups]:', err);
    return NextResponse.json({ error: 'Failed to load backups' }, { status: 500 });
  }
}

export async function POST() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const rawJson = JSON.stringify(db);
    const sizeKB = Math.round(Buffer.byteLength(rawJson, 'utf8') / 1024);

    const backup = {
      id: Date.now().toString(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      size: `${sizeKB} KB`,
      status: 'Completed' as const,
      type: 'Manual DB Snapshot',
    };

    db.backups = [backup, ...(db.backups || [])].slice(0, 30);
    saveDb(db);

    return NextResponse.json(backup);
  } catch (err) {
    console.error('[API ERROR - POST /api/admin/backups]:', err);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}
