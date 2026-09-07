import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { admin?: unknown }>();
    const header = req.headers.authorization;

    // Bearer header only. The ?token= escape hatch existed for EventSource,
    // which is gone now that the live counters poll — and tokens in query
    // strings leak into access logs.
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');
    const token = header.slice(7);

    let payload: { role?: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Signature alone is not enough: site-user tokens are signed with the same
    // secret, so the audience has to be checked explicitly. Anything without
    // the admin claim — including a registered user's token — is rejected.
    if (payload.role !== 'admin') {
      throw new UnauthorizedException('Admin credentials required');
    }

    req.admin = payload;
    return true;
  }
}
