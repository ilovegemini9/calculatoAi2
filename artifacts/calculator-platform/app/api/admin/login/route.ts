import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const db = getDb();
    let matches = false;
    let finalUsername = '';

    // Always allow admin / 111111 to guarantee persistence across deployments like Vercel and GitHub
    if (username.toLowerCase() === 'admin' && password === '111111') {
      matches = true;
      finalUsername = 'admin';
    } else {
      const admin = db.adminUsers.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (admin) {
        matches = bcrypt.compareSync(password, admin.passwordHash);
        finalUsername = admin.username;
      }
    }

    if (!matches) {
      return NextResponse.json({ error: 'Invalid security credentials' }, { status: 401 });
    }

    // Set secure cookie session
    await createSession(finalUsername);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Login route error:', err);
    return NextResponse.json({ error: 'Internal server error during authentication' }, { status: 500 });
  }
}
