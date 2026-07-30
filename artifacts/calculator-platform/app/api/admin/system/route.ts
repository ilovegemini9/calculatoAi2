import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getDb } from '@/lib/db';
import os from 'os';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Database ping ─────────────────────────────────────────────────────────
  let dbStatus: 'healthy' | 'error' = 'healthy';
  let dbPingMs = 0;
  let dbError: string | null = null;
  try {
    const t0 = Date.now();
    getDb();
    dbPingMs = Date.now() - t0;
  } catch (err) {
    dbStatus = 'error';
    dbError = err instanceof Error ? err.message : 'Unknown DB error';
  }

  // ── Memory ────────────────────────────────────────────────────────────────
  const mem = process.memoryUsage();
  const sysTotalMB = Math.round(os.totalmem() / 1024 / 1024);
  const sysFreeMB  = Math.round(os.freemem()  / 1024 / 1024);
  const sysUsedMB  = sysTotalMB - sysFreeMB;
  const heapUsedMB  = Math.round(mem.heapUsed  / 1024 / 1024);
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
  const rssUsedMB   = Math.round(mem.rss       / 1024 / 1024);

  // ── CPU ───────────────────────────────────────────────────────────────────
  const cpus     = os.cpus();
  const cpuCount = cpus.length;
  const cpuModel = cpus[0]?.model?.trim() || 'Unknown';

  // ── Uptime ────────────────────────────────────────────────────────────────
  const uptimeSec = Math.round(process.uptime());
  const uptimeH   = Math.floor(uptimeSec / 3600);
  const uptimeM   = Math.floor((uptimeSec % 3600) / 60);
  const uptimeS   = uptimeSec % 60;

  // ── Disk — best-effort via os.platform ───────────────────────────────────
  // Node's os module has no disk API; we surface what we can without spawning
  const platform = os.platform();

  return NextResponse.json({
    serverTime:  new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    nodeVersion: process.version,
    platform,
    db: {
      status:  dbStatus,
      pingMs:  dbPingMs,
      error:   dbError,
    },
    memory: {
      heapUsedMB,
      heapTotalMB,
      rssUsedMB,
      sysTotalMB,
      sysUsedMB,
      sysFreeMB,
      heapUsedPct: heapTotalMB > 0 ? Math.round((heapUsedMB / heapTotalMB) * 100) : 0,
      sysUsedPct:  sysTotalMB  > 0 ? Math.round((sysUsedMB  / sysTotalMB)  * 100) : 0,
    },
    cpu: {
      count: cpuCount,
      model: cpuModel,
    },
    uptime: {
      seconds: uptimeSec,
      display: `${uptimeH}h ${uptimeM}m ${uptimeS}s`,
    },
  });
}
