import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, AssignMemberDto } from './projects.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('projects')
export class ProjectsPublicController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list() {
    return this.projects.findPublic();
  }
}

@Controller('admin/projects')
@UseGuards(AdminGuard)
export class ProjectsAdminController {
  constructor(private readonly projects: ProjectsService) {}

  @Get() list(@Query('status') status?: ProjectStatus) { return this.projects.findAll(status); }
  @Get(':id') get(@Param('id') id: string) { return this.projects.findOne(id); }
  @Post() create(@Body() dto: CreateProjectDto) { return this.projects.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateProjectDto) { return this.projects.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.projects.remove(id); }

  @Post(':id/members')
  assign(@Param('id') id: string, @Body() dto: AssignMemberDto) { return this.projects.assign(id, dto); }

  @Delete(':id/members/:memberId')
  unassign(@Param('id') id: string, @Param('memberId') memberId: string) { return this.projects.unassign(id, memberId); }
}
