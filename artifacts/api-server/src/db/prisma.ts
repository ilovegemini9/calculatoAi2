/**
 * Prisma Client singleton — Prisma 7 adapter-based setup for Neon PostgreSQL.
 *
 * Prevents multiple instances during development (hot-reload) and in serverless
 * environments where modules can be re-imported per invocation.
 *
 * Usage:
 *   import { prisma } from './prisma.js';
 *   const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // Allow a single instance to be cached across hot-reloads in development.
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[prisma] DATABASE_URL is not set — Prisma client may fail at runtime.');
  }

  const adapter = connectionString
    ? new PrismaPg({ connectionString })
    : undefined;

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

/**
 * Gracefully disconnect Prisma on process exit so the Neon connection pool
 * is released cleanly.
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
