import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto } from './members.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('members')
export class MembersPublicController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list() {
    return this.members.findPublic();
  }
}

@Controller('admin/members')
@UseGuards(AdminGuard)
export class MembersAdminController {
  constructor(private readonly members: MembersService) {}

  @Get() list() { return this.members.findAll(); }
  @Get(':id') get(@Param('id') id: string) { return this.members.findOne(id); }
  @Post() create(@Body() dto: CreateMemberDto) { return this.members.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMemberDto) { return this.members.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.members.remove(id); }
}
