import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * On Vercel every cold start builds a fresh module scope, so we stash the
 * client on globalThis. Warm invocations then reuse one connection pool
 * instead of opening a new one per request, which would exhaust Postgres.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? '';

  // Serverless must go through a pooler, and Prisma has to be told to skip
  // prepared statements when it does — otherwise PgBouncer-style poolers
  // fail with "prepared statement \"s0\" already exists" under concurrency.
  if (process.env.VERCEL && url && !url.includes('pgbouncer=true')) {
    new Logger('PrismaService').warn(
      'DATABASE_URL has no ?pgbouncer=true — add it (and use the pooled Neon host) or expect "prepared statement already exists" errors.',
    );
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    if (!globalForPrisma.prisma) globalForPrisma.prisma = this;
  }

  async onModuleInit() {
    // On Vercel, connect lazily. Prisma opens a connection on first query
    // anyway, and eager connecting means one bad DATABASE_URL takes down the
    // whole function at boot — an opaque FUNCTION_INVOCATION_FAILED — instead
    // of failing only the routes that touch the database.
    if (process.env.VERCEL) return;
    await this.$connect();
  }

  async onModuleDestroy() {
    // Serverless functions are frozen rather than shut down; disconnecting
    // there would drop a pool the next warm invocation still wants.
    if (process.env.VERCEL) return;
    await this.$disconnect();
  }
}

/** Exported for scripts that need a client outside the Nest container. */
export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
