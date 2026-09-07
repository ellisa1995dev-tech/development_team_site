import { Body, Controller, Delete, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { RegisterDto, LoginUserDto, SignupActivityDto, CancelMembershipDto } from './users.dto';
import { UserGuard, type UserTokenPayload } from './user.guard';

type AuthedRequest = Request & { user?: UserTokenPayload };

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post('register')
  @HttpCode(201)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.users.register(dto, req);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginUserDto) {
    return this.users.login(dto);
  }

  @Get('me')
  @UseGuards(UserGuard)
  me(@Req() req: AuthedRequest) {
    return this.users.me(req.user!.sub);
  }

  @Post('heartbeat')
  @HttpCode(200)
  @UseGuards(UserGuard)
  heartbeat(@Req() req: AuthedRequest) {
    return this.users.heartbeat(req.user!.sub);
  }

  /**
   * Closes the caller's own account. Requires their password again, because
   * the action cannot be undone.
   */
  @Delete('me')
  @HttpCode(200)
  @UseGuards(UserGuard)
  cancelMembership(@Body() dto: CancelMembershipDto, @Req() req: AuthedRequest) {
    return this.users.cancelMembership(req.user!.sub, dto.password, dto.reason);
  }

  /** Public: pinged while the registration form is being filled in. */
  @Post('signup-activity')
  @HttpCode(202)
  signupActivity(@Body() dto: SignupActivityDto, @Req() req: Request) {
    return this.users.signupActivity(dto.sessionId, req);
  }

  @Post('signup-abandon')
  @HttpCode(202)
  abandonSignup(@Body() dto: SignupActivityDto) {
    return this.users.abandonSignup(dto.sessionId);
  }
}
