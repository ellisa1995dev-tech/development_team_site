import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  /** Audience. Only site-user tokens are issued now. */
  role?: string;
  /** Elevation, granted from the ADMIN_EMAILS allowlist. */
  access?: UserRole;
}

/**
 * Gates the admin console.
 *
 * There is one account system: a registered site user whose email is on the
 * ADMIN_EMAILS allowlist carries `access: MANAGER`, and that single claim
 * unlocks both the management overview and this console.
 *
 * Signature alone is never enough — the claim is checked explicitly, because
 * every token the app issues is signed with the same secret.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { admin?: TokenPayload }>();
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Sign in to continue.');

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    if (payload.role !== 'user') throw new UnauthorizedException('Sign in to continue.');

    if (payload.access !== UserRole.MANAGER) {
      throw new ForbiddenException('This area is limited to management accounts.');
    }

    req.admin = payload;
    return true;
  }
}
