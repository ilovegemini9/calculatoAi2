import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-calculator-platform-key';

/** Sign a username with HMAC-SHA256. Deterministic — no random salt. */
function signUsername(username: string): string {
  return createHmac('sha256', SESSION_SECRET).update(username).digest('hex');
}

/** Timing-safe comparison of the stored signature against the expected value. */
function verifySignature(username: string, signature: string): boolean {
  try {
    const expected = signUsername(username);
    // Both buffers must be the same length for timingSafeEqual
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return false;
  }
}

export async function createSession(username: string) {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const signature = signUsername(username);
  const sessionToken = JSON.stringify({ username, signature });

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) return false;

  try {
    const { username, signature } = JSON.parse(sessionCookie.value) as {
      username?: string;
      signature?: string;
    };
    if (!username || !signature) return false;
    return verifySignature(username, signature);
  } catch {
    return false;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
