import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { isPrivateIp } from './client-ip';

export interface GeoLocation {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

/**
 * Resolves an IP to a coarse location.
 *
 * Order of preference:
 *   1. Edge headers (Cloudflare / Vercel) — free, instant, no third party.
 *   2. An HTTP geo provider (ip-api.com by default; no API key needed).
 *
 * Results are memo-cached per IP so a burst of page views costs one lookup.
 * Swap `lookupRemote` for a local MaxMind GeoLite2 reader in production if you
 * would rather not send visitor IPs to a third party.
 */
@Injectable()
export class GeoIpService {
  private readonly logger = new Logger(GeoIpService.name);
  private readonly cache = new Map<string, { value: GeoLocation; expires: number }>();
  private readonly ttlMs = 24 * 60 * 60 * 1000;
  private readonly maxCacheEntries = 5_000;

  async resolve(ip: string, req?: Request): Promise<GeoLocation> {
    const fromHeaders = req ? this.fromEdgeHeaders(req) : {};
    if (fromHeaders.latitude != null && fromHeaders.longitude != null) return fromHeaders;

    if (isPrivateIp(ip)) return { ...this.localFallback(), ...fromHeaders };

    const cached = this.cache.get(ip);
    if (cached && cached.expires > Date.now()) return { ...cached.value, ...fromHeaders };

    const remote = await this.lookupRemote(ip);
    if (remote) {
      if (this.cache.size >= this.maxCacheEntries) this.cache.clear();
      this.cache.set(ip, { value: remote, expires: Date.now() + this.ttlMs });
      return { ...remote, ...fromHeaders };
    }

    return fromHeaders;
  }

  /** Cloudflare and Vercel both inject geo headers at the edge. */
  private fromEdgeHeaders(req: Request): GeoLocation {
    const h = req.headers;
    const str = (k: string) => {
      const v = h[k];
      return typeof v === 'string' && v.length > 0 ? decodeURIComponent(v) : undefined;
    };
    const num = (k: string) => {
      const v = str(k);
      const n = v ? Number(v) : NaN;
      return Number.isFinite(n) ? n : undefined;
    };

    const countryCode = str('cf-ipcountry') ?? str('x-vercel-ip-country');
    return {
      countryCode,
      country: countryCode,
      region: str('x-vercel-ip-country-region'),
      city: str('cf-ipcity') ?? str('x-vercel-ip-city'),
      latitude: num('cf-iplatitude') ?? num('x-vercel-ip-latitude'),
      longitude: num('cf-iplongitude') ?? num('x-vercel-ip-longitude'),
      timezone: str('x-vercel-ip-timezone'),
    };
  }

  /** Local dev has no routable IP; pin a placeholder so the map is not empty. */
  private localFallback(): GeoLocation {
    return {
      country: 'Local',
      countryCode: 'LO',
      region: 'Localhost',
      city: 'Localhost',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
    };
  }

  private async lookupRemote(ip: string): Promise<GeoLocation | null> {
    if ((process.env.GEOIP_PROVIDER ?? 'ipapi') === 'none') return null;

    const timeout = Number(process.env.GEOIP_TIMEOUT_MS ?? 2500);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,lat,lon,timezone`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;

      const data = (await res.json()) as Record<string, unknown>;
      if (data.status !== 'success') return null;

      return {
        country: data.country as string,
        countryCode: data.countryCode as string,
        region: data.regionName as string,
        city: data.city as string,
        latitude: data.lat as number,
        longitude: data.lon as number,
        timezone: data.timezone as string,
      };
    } catch (err) {
      // A geo miss must never break the page view it came from.
      this.logger.warn(`Geo lookup failed for ${ip}: ${(err as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
