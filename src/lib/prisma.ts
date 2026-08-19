import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * Connections each serverless instance may hold. Vercel runs many instances in
 * parallel, so the ceiling that matters is instances × this number — keep it
 * small and point DATABASE_URL at a pooler (PgBouncer) rather than raising it.
 */
const POOL_MAX = Number(process.env.DATABASE_POOL_MAX ?? 5);

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — copy .env.example to .env');
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: POOL_MAX,
      // Release idle connections quickly: a frozen serverless instance holds
      // them open on the database side long after it stops serving requests.
      idleTimeoutMillis: 10_000,
      // Fail fast instead of hanging the request when the pooler is saturated.
      connectionTimeoutMillis: 10_000,
    }),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

/**
 * Cached on globalThis in every environment: locally it survives HMR, and in
 * production it keeps a re-evaluated module from opening a second pool.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
