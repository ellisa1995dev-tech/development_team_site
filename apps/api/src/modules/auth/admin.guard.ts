import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { admin?: unknown }>();
    const header = req.headers.authorization;

    // EventSource cannot set headers, so the SSE stream passes ?token= instead.
    const queryToken = typeof req.query?.token === 'string' ? req.query.token : undefined;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      req.admin = await this.jwt.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
