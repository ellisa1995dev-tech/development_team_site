import { Controller, Get, UseGuards } from '@nestjs/common';
import { ManagementService } from './management.service';
import { ManagerGuard } from '../users/manager.guard';

/** Every route here requires a MANAGER token — see ManagerGuard. */
@Controller('management')
@UseGuards(ManagerGuard)
export class ManagementController {
  constructor(private readonly management: ManagementService) {}

  @Get('overview')
  overview() {
    return this.management.overview();
  }

  @Get('projects')
  projects() {
    return this.management.activeProjects();
  }

  @Get('orders')
  orders() {
    return this.management.recentOrders();
  }

  @Get('applications')
  applications() {
    return this.management.recentApplications();
  }

  @Get('team')
  team() {
    return this.management.team();
  }
}
