import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoIpService } from '../../common/geoip.service';
import { getClientIp } from '../../common/client-ip';
import { RegisterDto, LoginUserDto } from './users.dto';

/** A sign-up in progress counts as "live" for this long after its last ping. */
const SIGNUP_STALE_MS = 2 * 60 * 1000;
/** A registered user counts as "online" for this long after their last ping. */
const ONLINE_STALE_MS = 5 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly geoip: GeoIpService,
  ) {}

  static signupCutoff(): Date {
    return new Date(Date.now() - SIGNUP_STALE_MS);
  }

  static onlineCutoff(): Date {
    return new Date(Date.now() - ONLINE_STALE_MS);
  }

  private sign(user: { id: string; email: string; fullName: string }) {
    return this.jwt.signAsync({ sub: user.id, email: user.email, name: user.fullName, role: 'user' });
  }

  private publicShape(user: { id: string; email: string; fullName: string; company: string | null }) {
    return { id: user.id, email: user.email, fullName: user.fullName, company: user.company };
  }

  async register(dto: RegisterDto, req: Request) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with that email already exists. Please sign in instead.');
    }

    // Locate once, at registration — this is what the admin user map plots.
    const geo = await this.geoip.resolve(getClientIp(req), req);

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        company: dto.company?.trim() || null,
        passwordHash: await bcrypt.hash(dto.password, 10),
        country: geo.country ?? null,
        countryCode: geo.countryCode ?? null,
        region: geo.region ?? null,
        city: geo.city ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
      },
    });

    // The visitor is no longer "signing up" — they are registered.
    if (dto.signupSessionId) {
      await this.prisma.signupSession
        .updateMany({ where: { sessionId: dto.signupSessionId }, data: { completed: true } })
        .catch(() => undefined);
    }

    return { token: await this.sign(user), user: this.publicShape(user) };
  }

  async login(dto: LoginUserDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Compare against a dummy hash on miss so timing does not leak existence.
    const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    const ok = await bcrypt.compare(dto.password, hash);
    if (!user || !ok) throw new UnauthorizedException('Invalid email or password');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });

    return { token: await this.sign(user), user: this.publicShape(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account no longer exists');
    return this.publicShape(user);
  }

  /** Keeps the "online now" counter honest while a signed-in user browses. */
  async heartbeat(userId: string) {
    await this.prisma.user
      .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
    return { ok: true };
  }

  /**
   * Called by the registration form while someone is filling it in, so the
   * admin console can show how many people are mid-sign-up right now.
   */
  async signupActivity(sessionId: string, req: Request) {
    const now = new Date();
    const existing = await this.prisma.signupSession.findUnique({ where: { sessionId } });

    if (existing) {
      await this.prisma.signupSession.update({ where: { sessionId }, data: { lastSeenAt: now } });
      return { ok: true };
    }

    const geo = await this.geoip.resolve(getClientIp(req), req);
    await this.prisma.signupSession
      .create({
        data: {
          sessionId,
          lastSeenAt: now,
          country: geo.country ?? null,
          countryCode: geo.countryCode ?? null,
          city: geo.city ?? null,
          latitude: geo.latitude ?? null,
          longitude: geo.longitude ?? null,
        },
      })
      // A concurrent ping may have created it first; that is fine.
      .catch(() => undefined);

    return { ok: true };
  }

  /** Someone closed the form or navigated away without finishing. */
  async abandonSignup(sessionId: string) {
    await this.prisma.signupSession.deleteMany({ where: { sessionId, completed: false } });
    return { ok: true };
  }
}
