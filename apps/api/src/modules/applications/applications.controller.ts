import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApplicationStatus } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './applications.dto';
import { AdminGuard } from '../auth/admin.guard';
import { UserGuard, type UserTokenPayload } from '../users/user.guard';

@Controller('applications')
export class ApplicationsPublicController {
  constructor(private readonly applications: ApplicationsService) {}

  /** Requires a registered account — the guard rejects anonymous posts. */
  @Post()
  @UseGuards(UserGuard)
  create(@Body() dto: CreateApplicationDto, @Req() req: Request & { user?: UserTokenPayload }) {
    return this.applications.create(dto, req.user!.sub);
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
