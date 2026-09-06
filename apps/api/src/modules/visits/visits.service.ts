import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoIpService } from '../../common/geoip.service';
import { getClientIp, detectDevice } from '../../common/client-ip';

export interface TrackInput {
  path: string;
  referrer?: string;
  sessionId?: string;
}

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoip: GeoIpService,
  ) {}

  private hashIp(ip: string): string {
    const salt = process.env.IP_HASH_SALT ?? 'dev-salt';
    return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
  }

  async track(input: TrackInput, req: Request) {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const device = detectDevice(userAgent);
    const sessionId = input.sessionId || randomUUID();

    // Bots inflate the map without representing real people.
    if (device === 'bot') return { sessionId, recorded: false };

    const geo = await this.geoip.resolve(ip, req);

    await this.prisma.visit.create({
      data: {
        sessionId,
        ipHash: this.hashIp(ip),
        path: input.path.slice(0, 500),
        referrer: input.referrer?.slice(0, 500) ?? null,
        userAgent: userAgent?.slice(0, 500) ?? null,
        device,
        country: geo.country ?? null,
        countryCode: geo.countryCode ?? null,
        region: geo.region ?? null,
        city: geo.city ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        timezone: geo.timezone ?? null,
      },
    });

    return { sessionId, recorded: true };
  }
}
