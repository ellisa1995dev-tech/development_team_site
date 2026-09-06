/**
 * Vercel serverless entry for the NestJS API.
 *
 * Vercel compiles functions with esbuild, which does not emit the decorator
 * metadata Nest depends on — so the app is compiled ahead of time by `nest
 * build` (tsc) during the Vercel build step, and this handler just wires the
 * compiled output to the incoming request.
 *
 * The Nest instance is cached on the module scope so warm invocations reuse
 * the same Express app and the same Prisma connection pool.
 */
require('reflect-metadata');

const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');

let cachedServer;

async function bootstrap() {
  // Required lazily so a missing build surfaces as a readable message rather
  // than an unexplained FUNCTION_INVOCATION_FAILED at module load.
  const { AppModule } = require('../dist/app.module');

  const expressApp = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });

  // Set on the Express instance directly — not every Nest adapter surface
  // exposes `.set()`, and this is what actually reads X-Forwarded-For.
  expressApp.set('trust proxy', true);

  const origins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({ origin: origins.length ? origins : false, credentials: true });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  return expressApp;
}

/** Vars the app cannot start without. */
const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'IP_HASH_SALT'];

module.exports = async (req, res) => {
  // Check before booting. Without this, a missing DATABASE_URL surfaces as
  // Prisma's "Environment variable not found" on every request, and the
  // retries pile up as "library already starting".
  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify(
        {
          error: 'API is not configured',
          missingEnvVars: missing,
          hint: 'Add these in the Vercel project (Settings -> Environment Variables), then redeploy.',
        },
        null,
        2,
      ),
    );
  }

  try {
    if (!cachedServer) cachedServer = bootstrap();
    const server = await cachedServer;
    return server(req, res);
  } catch (err) {
    // A cached rejected promise would poison every later invocation, so drop
    // it and let the next request retry a cold boot.
    cachedServer = undefined;

    // Vercel reports an unhandled throw as FUNCTION_INVOCATION_FAILED with no
    // detail. Log it and answer with the actual reason instead.
    console.error('[api] bootstrap failed:', err && err.stack ? err.stack : err);

    const missing = ['DATABASE_URL', 'JWT_SECRET', 'IP_HASH_SALT'].filter((k) => !process.env[k]);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify(
        {
          error: 'API failed to start',
          message: err && err.message ? err.message : String(err),
          missingEnvVars: missing.length ? missing : undefined,
          hint: missing.length
            ? 'Set the environment variables above in the Vercel project, then redeploy.'
            : 'Check the function logs for the stack trace above.',
        },
        null,
        2,
      ),
    );
  }
};
