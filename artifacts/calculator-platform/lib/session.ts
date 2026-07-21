import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-calculator-platform-key';

export async function createSession(username: string) {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Create a simple token containing username and hash signature
  const salt = bcrypt.genSaltSync(10);
  const signature = bcrypt.hashSync(username + SESSION_SECRET, salt);
  const sessionToken = JSON.stringify({ username, signature });
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: expiresAt,
    path: '/',
  });
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie || !sessionCookie.value) {
    return false;
  }
  
  try {
    const { username, signature } = JSON.parse(sessionCookie.value);
    if (!username || !signature) return false;
    
    // Verify signature matches
    const isMatched = bcrypt.compareSync(username + SESSION_SECRET, signature);
    return isMatched;
  } catch {
    return false;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
