import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 },
      );
    }

    let matches = false;
    let finalUsername = '';

    // Check ADMIN_PASSWORD env var override (for deployment environments)
    // This path avoids any filesystem access — safe on read-only hosts like Vercel
    const envPassword = process.env.ADMIN_PASSWORD;
    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    if (
      envPassword &&
      username.toLowerCase() === envUsername.toLowerCase() &&
      password === envPassword
    ) {
      matches = true;
      finalUsername = envUsername;
    }

    // Check DB users (bcrypt-hashed) — only reached when env var auth didn't match
    if (!matches) {
      const db = getDb();
      const admin = db.adminUsers.find(
        (u) => u.username.toLowerCase() === username.toLowerCase(),
      );
      if (admin) {
        matches = bcrypt.compareSync(password, admin.passwordHash);
        finalUsername = admin.username;
      }
    }

    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid security credentials' },
        { status: 401 },
      );
    }

    await createSession(finalUsername);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Login route error:', err);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 },
    );
  }
}
