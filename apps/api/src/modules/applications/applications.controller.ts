import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './applications.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('applications')
export class ApplicationsPublicController {
  constructor(private readonly applications: ApplicationsService) {}

  /** Public: the "join the team" form posts here. */
  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applications.create(dto);
  }
}

@Controller('admin/applications')
@UseGuards(AdminGuard)
export class ApplicationsAdminController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get() list(@Query('status') status?: ApplicationStatus) { return this.applications.findAll(status); }
  @Get(':id') get(@Param('id') id: string) { return this.applications.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) { return this.applications.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.applications.remove(id); }
}
