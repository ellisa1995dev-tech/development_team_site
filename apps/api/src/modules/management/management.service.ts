import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';

/**
 * Read models for the management section.
 *
 * Deliberately read-only. Managers get operational visibility; changing state
 * still goes through the admin console, which has its own credentials. That
 * keeps the blast radius of the email allowlist small — being on it lets you
 * see the business, not rewrite it.
 */
@Injectable()
export class ManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      activeProjects,
      totalProjects,
      newOrders,
      totalOrders,
      newApplications,
      totalApplications,
      activeMembers,
      registeredUsers,
      onlineUsers,
      registeredToday,
    ] = await Promise.all([
      this.prisma.project.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count(),
      this.prisma.projectOrder.count({ where: { status: 'NEW' } }),
      this.prisma.projectOrder.count(),
      this.prisma.joinApplication.count({ where: { status: 'NEW' } }),
      this.prisma.joinApplication.count(),
      this.prisma.teamMember.count({ where: { active: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { lastSeenAt: { gte: UsersService.onlineCutoff() } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);

    return {
      projects: { active: activeProjects, total: totalProjects },
      orders: { new: newOrders, total: totalOrders },
      applications: { new: newApplications, total: totalApplications },
      team: { active: activeMembers },
      users: { registered: registeredUsers, onlineNow: onlineUsers, registeredToday },
      at: new Date().toISOString(),
    };
  }

  /** Projects in progress, with who is on them. */
  activeProjects() {
    return this.prisma.project.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        summary: true,
        progress: true,
        startedAt: true,
        clientName: true,
        stack: true,
        isPublic: true,
        assignments: {
          select: { id: true, roleOnProject: true, member: { select: { id: true, name: true, role: true } } },
        },
      },
    });
  }

  /** Recent inbound work. Contact details included; managers are trusted staff. */
  recentOrders(limit = 10) {
    return this.prisma.projectOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        projectType: true,
        budgetRange: true,
        timeline: true,
        status: true,
        createdAt: true,
        _count: { select: { attachments: true } },
      },
    });
  }

  recentApplications(limit = 10) {
    return this.prisma.joinApplication.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        position: true,
        yearsExperience: true,
        status: true,
        ideaPitch: true,
        createdAt: true,
      },
    });
  }

  team() {
    return this.prisma.teamMember.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }],
      select: {
        id: true,
        name: true,
        title: true,
        role: true,
        yearsExperience: true,
        location: true,
        _count: { select: { assignments: true } },
      },
    });
  }
}
