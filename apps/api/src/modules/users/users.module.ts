import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserGuard } from './user.guard';
import { GeoIpService } from '../../common/geoip.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserGuard, GeoIpService],
  exports: [UsersService, UserGuard],
})
export class UsersModule {}
