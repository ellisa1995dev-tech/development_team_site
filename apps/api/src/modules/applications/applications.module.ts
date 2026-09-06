import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsPublicController, ApplicationsAdminController } from './applications.controller';

@Module({
  controllers: [ApplicationsPublicController, ApplicationsAdminController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
