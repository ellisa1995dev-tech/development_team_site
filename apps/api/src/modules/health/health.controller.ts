import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseAdminEmails } from '../users/admin-emails';

/**
 * Deployment triage. `/api/health` proves the function booted and Nest wired
 * itself up; `/api/health/db` separately proves the database is reachable.
 * Splitting them tells you immediately which half is broken.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  root() {
    return {
      status: 'ok',
      runtime: process.env.VERCEL ? 'vercel' : 'node',
      node: process.version,
      env: {
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        JWT_SECRET: Boolean(process.env.JWT_SECRET),
        IP_HASH_SALT: Boolean(process.env.IP_HASH_SALT),
        CORS_ORIGIN: process.env.CORS_ORIGIN ?? null,
        pooled: (process.env.DATABASE_URL ?? '').includes('pgbouncer=true'),
        // Count only — never the addresses themselves, which would tell an
        // anonymous caller exactly which accounts to go after.
        adminEmailsConfigured: parseAdminEmails(process.env.ADMIN_EMAILS).length,
      },
      at: new Date().toISOString(),
    };
  }

  @Get('db')
  async db() {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', latencyMs: Date.now() - started };
    } catch (err) {
      return {
        status: 'error',
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
