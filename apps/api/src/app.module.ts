import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { MembersModule } from './modules/members/members.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { VisitsModule } from './modules/visits/visits.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Blunt abuse protection on the public write endpoints.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MembersModule,
    ProjectsModule,
    OrdersModule,
    ApplicationsModule,
    VisitsModule,
    StatsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
