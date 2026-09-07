import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from './admin.guard';

/**
 * Token plumbing only.
 *
 * There is no separate admin login any more: /api/users/login issues the one
 * token the whole application uses, and elevation comes from the ADMIN_EMAILS
 * allowlist. This module just registers the signer and the console guard.
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'insecure-dev-secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '12h') as `${number}h` },
    }),
  ],
  providers: [AdminGuard],
  exports: [AdminGuard],
})
export class AuthModule {}
