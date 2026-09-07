import { Module } from '@nestjs/common';
import { ManagementService } from './management.service';
import { ManagementController } from './management.controller';
import { ManagerGuard } from '../users/manager.guard';

@Module({
  controllers: [ManagementController],
  providers: [ManagementService, ManagerGuard],
})
export class ManagementModule {}
