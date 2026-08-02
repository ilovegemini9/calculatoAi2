export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { setSessionOnResponse } from '@/lib/session';
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
    const envUsername = process.env.ADMIN_USERNAME;
    if (
      envPassword &&
      envUsername &&
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

    // Set the session cookie directly on the response object — this is the
    // reliable approach on Vercel/serverless (avoids cookies() from next/headers
    // not propagating to the response in some Next.js 15 configurations).
    const loginResponse = NextResponse.json({ success: true });
    setSessionOnResponse(loginResponse, finalUsername);
    try {
      const { logEvent } = await import('@/lib/db');
      logEvent('INFO', `Admin user '${finalUsername}' logged in successfully.`, '/api/admin/login');
    } catch { /* ignore */ }
    return loginResponse;
  } catch (err) {
    console.error('Login route error:', err);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 },
    );
  }
}
