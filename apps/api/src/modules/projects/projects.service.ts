import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, AssignMemberDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public showcase: client names and internal notes stay out of the payload. */
  findPublic() {
    return this.prisma.project.findMany({
      where: { isPublic: true },
      orderBy: [{ featured: 'desc' }, { startedAt: 'desc' }],
      select: {
        id: true, name: true, slug: true, summary: true, status: true,
        domain: true, stack: true, startedAt: true, completedAt: true, featured: true,
      },
    });
  }

  findAll(status?: ProjectStatus) {
    return this.prisma.project.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: 'asc' }, { startedAt: 'desc' }],
      include: {
        assignments: {
          include: { member: { select: { id: true, name: true, role: true, title: true } } },
        },
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { assignments: { include: { member: true } } },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        startedAt: new Date(dto.startedAt),
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startedAt ? { startedAt: new Date(dto.startedAt) } : {}),
        ...(dto.completedAt ? { completedAt: new Date(dto.completedAt) } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
    return { deleted: true };
  }

  async assign(projectId: string, dto: AssignMemberDto) {
    await this.findOne(projectId);
    return this.prisma.projectAssignment.upsert({
      where: { projectId_memberId: { projectId, memberId: dto.memberId } },
      create: { projectId, memberId: dto.memberId, roleOnProject: dto.roleOnProject, allocation: dto.allocation ?? 100 },
      update: { roleOnProject: dto.roleOnProject, allocation: dto.allocation ?? 100 },
    });
  }

  async unassign(projectId: string, memberId: string) {
    await this.prisma.projectAssignment.deleteMany({ where: { projectId, memberId } });
    return { removed: true };
  }
}
