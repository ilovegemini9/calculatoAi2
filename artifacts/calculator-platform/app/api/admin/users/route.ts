export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = await getDb();
    // Never return passwordHash
    const sanitized = db.adminUsers.map(({ id, username, createdAt }) => ({
      id,
      username,
      createdAt,
    }));
    return NextResponse.json(sanitized);
  } catch (err) {
    console.error('[API ERROR - GET /api/admin/users]:', err);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json({ error: 'username and password are required' }, { status: 400 });
    }

    const db = await getDb();
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
    await saveDb(db);
    return NextResponse.json({ id: user.id, username: user.username, createdAt: user.createdAt });
  } catch (err) {
    console.error('[API ERROR - POST /api/admin/users]:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const db = await getDb();
    // Protect the first admin account
    const target = db.adminUsers.find((u) => u.id === id);
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (db.adminUsers.indexOf(target) === 0) {
      return NextResponse.json({ error: 'Cannot delete the primary administrator account' }, { status: 403 });
    }

    db.adminUsers = db.adminUsers.filter((u) => u.id !== id);
    await saveDb(db);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API ERROR - DELETE /api/admin/users]:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
