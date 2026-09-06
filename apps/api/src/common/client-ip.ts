import type { Request } from 'express';

/**
 * Best-effort client IP. Proxy headers are only trusted because `trust proxy`
 * is enabled in main.ts — behind an untrusted edge these are spoofable.
 */
export function getClientIp(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf;

  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real) return real;

  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();

  return req.ip ?? req.socket.remoteAddress ?? '0.0.0.0';
}

export function isPrivateIp(ip: string): boolean {
  const clean = ip.replace(/^::ffff:/, '');
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === '0.0.0.0' ||
    /^10\./.test(clean) ||
    /^192\.168\./.test(clean) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(clean) ||
    /^169\.254\./.test(clean) ||
    /^f[cd]/i.test(clean)
  );
}

export function detectDevice(userAgent?: string): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/bot|crawler|spider|crawling|headless/.test(ua)) return 'bot';
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/mobi|android|iphone|ipod|phone/.test(ua)) return 'mobile';
  return 'desktop';
}
