import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  // Never return passwordHash
  const sanitized = db.adminUsers.map(({ id, username, createdAt }) => ({
    id,
    username,
    createdAt,
  }));
  return NextResponse.json(sanitized);
}

export async function POST(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { username, password } = body as { username: string; password: string };

  if (!username || !password) {
    return NextResponse.json({ error: 'username and password are required' }, { status: 400 });
  }

  const db = getDb();
  const exists = db.adminUsers.find((u) => u.username === username);
  if (exists) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const user = {
    id: Date.now().toString(),
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.adminUsers.push(user);
  saveDb(db);
  return NextResponse.json({ id: user.id, username: user.username, createdAt: user.createdAt });
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = getDb();
  // Protect the first admin account
  const target = db.adminUsers.find((u) => u.id === id);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (db.adminUsers.indexOf(target) === 0) {
    return NextResponse.json({ error: 'Cannot delete the primary administrator account' }, { status: 403 });
  }

  db.adminUsers = db.adminUsers.filter((u) => u.id !== id);
  saveDb(db);
  return NextResponse.json({ ok: true });
}
