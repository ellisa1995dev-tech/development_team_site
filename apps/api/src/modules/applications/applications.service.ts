import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto, UpdateApplicationDto } from './applications.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApplicationDto) {
    const app = await this.prisma.joinApplication.create({ data: dto });
    return { id: app.id, createdAt: app.createdAt };
  }

  findAll(status?: ApplicationStatus) {
    return this.prisma.joinApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const app = await this.prisma.joinApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return app;
  }

  async update(id: string, dto: UpdateApplicationDto) {
    await this.findOne(id);
    return this.prisma.joinApplication.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.joinApplication.delete({ where: { id } });
    return { deleted: true };
  }
}
