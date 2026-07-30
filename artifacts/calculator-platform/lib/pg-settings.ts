/**
 * PostgreSQL-backed persistent settings storage.
 *
 * Keeps a single `platform_settings` key-value table where each key stores a
 * JSONB blob.  Falls back gracefully when DATABASE_URL is not configured so
 * the app still works in purely local development without a database.
 */

import { Pool } from 'pg';

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

let tableReady = false;

async function ensureTable(): Promise<void> {
  if (!pool || tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key        TEXT PRIMARY KEY,
      value      JSONB        NOT NULL,
      updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
  tableReady = true;
}

/** Read a settings blob by key.  Returns null when not found or DB unavailable. */
export async function getSetting<T>(key: string): Promise<T | null> {
  if (!pool) return null;
  try {
    await ensureTable();
    const result = await pool.query<{ value: T }>(
      'SELECT value FROM platform_settings WHERE key = $1',
      [key],
    );
    return result.rows.length > 0 ? result.rows[0].value : null;
  } catch (err) {
    console.error('[pg-settings] getSetting error:', err);
    return null;
  }
}

/** Write a settings blob by key (upsert).  Returns true on success. */
export async function setSetting<T>(key: string, value: T): Promise<boolean> {
  if (!pool) return false;
  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO platform_settings (key, value, updated_at)
         VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key)
         DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
      [key, JSON.stringify(value)],
    );
    return true;
  } catch (err) {
    console.error('[pg-settings] setSetting error:', err);
    return false;
  }
}

/** True when a DATABASE_URL is configured and the pool is available. */
export function isPgAvailable(): boolean {
  return pool !== null;
}

/**
 * Ping PostgreSQL with a lightweight SELECT 1 and return the round-trip time
 * in milliseconds.  Returns null when the database is unavailable.
 */
export async function pingDb(): Promise<{ ms: number } | null> {
  if (!pool) return null;
  try {
    const t0 = Date.now();
    await pool.query('SELECT 1');
    return { ms: Date.now() - t0 };
  } catch {
    return null;
  }
}
