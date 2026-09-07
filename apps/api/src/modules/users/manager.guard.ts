import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

export interface ManagerTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: 'user';
  access: UserRole;
}

/**
 * Gates the management section.
 *
 * Enforced here, on the server, rather than by hiding the link in the UI —
 * a hidden route is not a protected one. The `access` claim is read from a
 * signed token, so a visitor cannot grant it to themselves.
 */
@Injectable()
export class ManagerGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { manager?: ManagerTokenPayload }>();
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Sign in to continue.');

    let payload: ManagerTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<ManagerTokenPayload>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    if (payload.role !== 'user') throw new UnauthorizedException('Sign in to continue.');

    if (payload.access !== UserRole.MANAGER) {
      throw new ForbiddenException('This area is limited to management accounts.');
    }

    req.manager = payload;
    return true;
  }
}
