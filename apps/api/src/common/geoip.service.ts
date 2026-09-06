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
/**
 * Overlays `override` onto `base`, ignoring keys whose value is undefined.
 *
 * A plain object spread would not do: fromEdgeHeaders() always returns every
 * key, so spreading it over a good result silently erased it whenever the
 * request carried no edge headers.
 */
function merge(base: GeoLocation, override: GeoLocation): GeoLocation {
  const out: GeoLocation = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined && value !== null && value !== '') {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

@Injectable()
export class GeoIpService {
  private readonly logger = new Logger(GeoIpService.name);
  private readonly cache = new Map<string, { value: GeoLocation; expires: number }>();
  private readonly ttlMs = 24 * 60 * 60 * 1000;
  private readonly maxCacheEntries = 5_000;

  async resolve(ip: string, req?: Request): Promise<GeoLocation> {
    const fromHeaders = req ? this.fromEdgeHeaders(req) : {};
    if (fromHeaders.latitude != null && fromHeaders.longitude != null) return fromHeaders;

    if (isPrivateIp(ip)) return merge(this.localFallback(), fromHeaders);

    const cached = this.cache.get(ip);
    if (cached && cached.expires > Date.now()) return merge(cached.value, fromHeaders);

    const remote = await this.lookupRemote(ip);
    if (remote) {
      if (this.cache.size >= this.maxCacheEntries) this.cache.clear();
      this.cache.set(ip, { value: remote, expires: Date.now() + this.ttlMs });
      return merge(remote, fromHeaders);
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

  /**
   * Local dev has no routable IP, so there is nothing real to resolve.
   *
   * Set GEOIP_DEV_LATLNG (e.g. "35.6762,139.6503") to pin a placeholder so the
   * admin map has something to draw while developing. Unset, we return no
   * coordinates rather than inventing them - an empty map is honest, and a
   * marker at 0,0 in the Gulf of Guinea is not.
   */
  private localFallback(): GeoLocation {
    const raw = process.env.GEOIP_DEV_LATLNG;
    if (!raw) return {};

    const [lat, lon] = raw.split(',').map((v) => Number(v.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      this.logger.warn(`GEOIP_DEV_LATLNG is not a valid "lat,lng" pair: ${raw}`);
      return {};
    }

    return {
      country: process.env.GEOIP_DEV_COUNTRY || 'Local development',
      countryCode: process.env.GEOIP_DEV_COUNTRY_CODE || 'LO',
      region: process.env.GEOIP_DEV_REGION || undefined,
      city: process.env.GEOIP_DEV_CITY || 'Local development',
      latitude: lat,
      longitude: lon,
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
