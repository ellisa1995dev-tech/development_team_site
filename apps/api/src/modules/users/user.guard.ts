import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface UserTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: 'user';
}

/**
 * Gates the actions that require a registered account: ordering a project and
 * applying to join the team. Admin tokens are deliberately rejected here — the
 * two audiences are separate.
 */
@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: UserTokenPayload }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Please register.');
    }

    let payload: UserTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<UserTokenPayload>(header.slice(7));
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    if (payload.role !== 'user') {
      throw new UnauthorizedException('Please register.');
    }

    req.user = payload;
    return true;
  }
}
