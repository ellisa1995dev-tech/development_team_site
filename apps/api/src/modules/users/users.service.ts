import { ConflictException, Injectable, Logger, UnauthorizedException, type OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoIpService } from '../../common/geoip.service';
import { MailService } from '../../common/mail.service';
import { newRegistrationAlert, membershipCancelledAlert } from '../../common/mail.templates';
import { getClientIp } from '../../common/client-ip';
import { RegisterDto, LoginUserDto } from './users.dto';
import { parseAdminEmails, hasDomainWildcard, roleForEmail } from './admin-emails';

/** A sign-up in progress counts as "live" for this long after its last ping. */
const SIGNUP_STALE_MS = 2 * 60 * 1000;
/** A registered user counts as "online" for this long after their last ping. */
const ONLINE_STALE_MS = 5 * 60 * 1000;

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly geoip: GeoIpService,
    private readonly mail: MailService,
  ) {}

  onModuleInit() {
    const allowlist = parseAdminEmails(process.env.ADMIN_EMAILS);

    if (!allowlist.length) {
      this.logger.log('ADMIN_EMAILS is empty — every registration gets the USER role.');
      return;
    }

    this.logger.log(`ADMIN_EMAILS: ${allowlist.length} entr${allowlist.length === 1 ? 'y' : 'ies'} grant management access.`);

    if (hasDomainWildcard(allowlist)) {
      this.logger.warn(
        'ADMIN_EMAILS contains a whole-domain entry. Because sign-up does not verify email ownership, anyone who registers with an address at that domain becomes a manager. Prefer listing individual addresses.',
      );
    }
  }

  /** The allowlist is read per call so a redeploy is not needed to change it. */
  private get adminEmails(): string[] {
    return parseAdminEmails(process.env.ADMIN_EMAILS);
  }

  static signupCutoff(): Date {
    return new Date(Date.now() - SIGNUP_STALE_MS);
  }

  static onlineCutoff(): Date {
    return new Date(Date.now() - ONLINE_STALE_MS);
  }

  private sign(user: { id: string; email: string; fullName: string; role: UserRole }) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.fullName,
      role: 'user',
      // Kept separate from `role` so the existing user/admin audience check is
      // untouched; this is what gates the management section.
      access: user.role,
    });
  }

  private publicShape(user: {
    id: string;
    email: string;
    fullName: string;
    company: string | null;
    role: UserRole;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      company: user.company,
      role: user.role,
      isManager: user.role === UserRole.MANAGER,
    };
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
        role: roleForEmail(email, this.adminEmails),
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

    // Fire-and-forget: a mail problem must never fail the registration the
    // visitor just completed. Errors surface in the logs instead.
    void this.mail
      .sendToAdmins((to) =>
        newRegistrationAlert({
          to,
          fullName: user.fullName,
          email: user.email,
          company: user.company,
          location: [user.city, user.region, user.country].filter(Boolean).join(', ') || null,
          registeredAt: user.createdAt,
        }),
      )
      .catch((err) => this.logger.error(`Registration alert failed: ${(err as Error).message}`));

    return { token: await this.sign(user), user: this.publicShape(user) };
  }

  /**
   * Closes an account at the owner's request.
   *
   * The password is re-checked here even though the caller is already
   * authenticated: this is irreversible, and a token left open on a shared
   * machine should not be enough to destroy an account.
   *
   * Orders and applications are deliberately kept. They are business records
   * of work the team was asked to do; the schema unlinks them (userId is set
   * to null) rather than deleting them with the account.
   */
  async cancelMembership(userId: string, password: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { orders: true, applications: true } } },
    });
    if (!user) throw new UnauthorizedException('Account no longer exists');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('That password is not correct.');

    await this.prisma.user.delete({ where: { id: userId } });

    void this.mail
      .sendToAdmins((to) =>
        membershipCancelledAlert({
          to,
          fullName: user.fullName,
          email: user.email,
          company: user.company,
          location: [user.city, user.region, user.country].filter(Boolean).join(', ') || null,
          registeredAt: user.createdAt,
          cancelledAt: new Date(),
          reason: reason?.trim() || null,
          ordersKept: user._count.orders,
          applicationsKept: user._count.applications,
        }),
      )
      .catch((err) => this.logger.error(`Cancellation alert failed: ${(err as Error).message}`));

    this.logger.log(`Membership cancelled: ${user.email}`);

    return {
      cancelled: true,
      ordersKept: user._count.orders,
      applicationsKept: user._count.applications,
    };
  }

  async login(dto: LoginUserDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Compare against a dummy hash on miss so timing does not leak existence.
    const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
    const ok = await bcrypt.compare(dto.password, hash);
    if (!user || !ok) throw new UnauthorizedException('Invalid email or password');

    const expected = roleForEmail(user.email, this.adminEmails);
    const fresh =
      expected === user.role
        ? await this.prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } })
        : await this.prisma.user.update({
            where: { id: user.id },
            data: { lastSeenAt: new Date(), role: expected },
          });

    if (expected !== user.role) {
      this.logger.log(`${user.email}: role ${user.role} -> ${expected} (ADMIN_EMAILS changed)`);
    }

    return { token: await this.sign(fresh), user: this.publicShape(fresh) };
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
