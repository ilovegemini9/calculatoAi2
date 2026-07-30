import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
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
}

export async function DELETE() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  db.logs = [];
  saveDb(db);
  return NextResponse.json({ ok: true });
}
