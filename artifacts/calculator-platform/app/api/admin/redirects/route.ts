import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  return NextResponse.json(db.redirects || []);
}

export async function POST(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { oldUrl, newUrl, statusCode } = body as {
    oldUrl: string;
    newUrl: string;
    statusCode: number;
  };

  if (!oldUrl || !newUrl) {
    return NextResponse.json({ error: 'oldUrl and newUrl are required' }, { status: 400 });
  }

  const db = getDb();
  const redirect = {
    id: Date.now().toString(),
    oldUrl,
    newUrl,
    statusCode: statusCode || 301,
    createdAt: new Date().toISOString(),
  };

  db.redirects.push(redirect);
  saveDb(db);
  return NextResponse.json(redirect);
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = getDb();
  db.redirects = db.redirects.filter((r) => r.id !== id);
  saveDb(db);
  return NextResponse.json({ ok: true });
}
