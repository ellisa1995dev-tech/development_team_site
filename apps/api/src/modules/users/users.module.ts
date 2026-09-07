import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersAdminController } from './users.admin.controller';
import { UserGuard } from './user.guard';
import { ManagerGuard } from './manager.guard';
import { GeoIpService } from '../../common/geoip.service';

@Module({
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService, UserGuard, ManagerGuard, GeoIpService],
  exports: [UsersService, UserGuard, ManagerGuard],
})
export class UsersModule {}
