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

const { AppModule } = require('../dist/app.module');

let cachedServer;

async function bootstrap() {
  const expressApp = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    // Vercel captures stdout; keep the noise down on every cold start.
    logger: ['error', 'warn'],
  });

  app.set('trust proxy', true);

  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? '').split(',').map((o) => o.trim()).filter(Boolean),
    credentials: true,
  });

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

module.exports = async (req, res) => {
  if (!cachedServer) {
    cachedServer = bootstrap();
  }
  const server = await cachedServer;
  return server(req, res);
};
