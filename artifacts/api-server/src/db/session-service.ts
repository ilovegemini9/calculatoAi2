/**
 * PostgreSQL-backed session service.
 *
 * Replaces in-memory JWT verification with proper database-stored sessions.
 * Tokens are still HMAC-signed JWTs so the existing admin client code works
 * unchanged — the signature is now also validated against a DB row, giving us
 * revocable, auditable sessions.
 */

import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import { prisma } from './prisma.js';

const _sessionSecret = process.env.SESSION_SECRET;
if (!_sessionSecret) {
  throw new Error(
    '[session] SESSION_SECRET environment variable is required but not set. ' +
    'Set it to a long random secret before starting the server.',
  );
}
const SESSION_SECRET: string = _sessionSecret;
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// ─── Token helpers ────────────────────────────────────────────────────────────

function b64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function signToken(username: string, issuedAt: number): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({ sub: username, iat: issuedAt, exp: issuedAt + TOKEN_TTL_MS }),
  );
  const sig = createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function verifySignature(token: string): { username: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const expectedSig = createHmac('sha256', SESSION_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!claims.sub || typeof claims.exp !== 'number') return null;
    return { username: claims.sub as string, exp: claims.exp as number };
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new session in PostgreSQL and return the signed token.
 * Falls back to a purely in-memory token if the DB is unavailable.
 */
export async function createSession(
  userId: string,
  username: string,
  opts?: { ipAddress?: string; userAgent?: string },
): Promise<string> {
  const issuedAt = Date.now();
  const token = signToken(username, issuedAt);
  const expiresAt = new Date(issuedAt + TOKEN_TTL_MS);

  try {
    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress: opts?.ipAddress ?? null,
        userAgent: opts?.userAgent ?? null,
      },
    });
  } catch (err) {
    console.error('[session] Failed to persist session to DB — token still issued.', err);
  }

  return token;
}

/**
 * Verify a token: check HMAC signature, expiry, and that a matching row
 * exists in the DB. Returns the username on success, null on failure.
 * Falls back to signature-only verification if the DB is unavailable.
 */
export async function verifySession(token: string): Promise<string | null> {
  if (!token) return null;

  const claims = verifySignature(token);
  if (!claims) return null;
  if (Date.now() > claims.exp) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      select: { expiresAt: true, userId: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      // Expired row — clean it up asynchronously
      prisma.session.delete({ where: { token } }).catch(() => {});
      return null;
    }
    return claims.username;
  } catch (err) {
    console.warn('[session] DB unavailable — falling back to signature-only verification.', err);
    // Graceful degradation: if Postgres is down, honour the signed token
    return claims.username;
  }
}

/**
 * Revoke (delete) a session by token.
 */
export async function revokeSession(token: string): Promise<void> {
  try {
    await prisma.session.deleteMany({ where: { token } });
  } catch (err) {
    console.error('[session] Failed to revoke session.', err);
  }
}

/**
 * Delete all expired sessions (maintenance task).
 */
export async function pruneExpiredSessions(): Promise<void> {
  try {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      console.log(`[session] Pruned ${result.count} expired session(s).`);
    }
  } catch (err) {
    console.error('[session] Failed to prune sessions.', err);
  }
}
