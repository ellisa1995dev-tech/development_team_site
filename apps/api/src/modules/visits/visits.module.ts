import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { GeoIpService } from '../../common/geoip.service';

@Module({
  controllers: [VisitsController],
  providers: [VisitsService, GeoIpService],
  exports: [VisitsService],
})
export class VisitsModule {}
