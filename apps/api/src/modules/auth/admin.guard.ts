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

    try {
      req.admin = await this.jwt.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
