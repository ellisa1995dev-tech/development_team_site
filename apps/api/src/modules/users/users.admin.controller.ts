import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';
import { AdminGuard } from '../auth/admin.guard';

class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

/**
 * Registered-user administration.
 *
 * Read-heavy: the console lists accounts so the team can see who has signed
 * up, where from, and what they have sent in. Role changes made here are a
 * manual override — the ADMIN_EMAILS allowlist still wins on the user's next
 * sign-in, which is deliberate: the environment stays the source of truth.
 */
@Controller('admin/registered-users')
@UseGuards(AdminGuard)
export class UsersAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        company: true,
        role: true,
        country: true,
        countryCode: true,
        region: true,
        city: true,
        lastSeenAt: true,
        createdAt: true,
        _count: { select: { orders: true, applications: true } },
      },
    });

    const onlineCutoff = UsersService.onlineCutoff();

    return users.map((u) => ({
      ...u,
      // Computed here so every client agrees on what "online" means.
      isOnline: u.lastSeenAt >= onlineCutoff,
      location: [u.city, u.region, u.country].filter(Boolean).join(', ') || null,
    }));
  }

  /** Distinct regions present in the data, for the filter dropdown. */
  @Get('regions')
  async regions() {
    const rows = await this.prisma.user.groupBy({
      by: ['country'],
      where: { country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
    });
    return rows.map((r) => ({ country: r.country, users: r._count.country }));
  }

  @Patch(':id/role')
  async setRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: { id: true, email: true, role: true },
    });
    return user;
  }
}
