import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto, UpdateMemberDto } from './members.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public roster: active members only, in display order. */
  findPublic() {
    return this.prisma.teamMember.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { yearsExperience: 'desc' }],
      select: {
        id: true, name: true, title: true, role: true, yearsExperience: true,
        bio: true, focus: true, skills: true, location: true, avatarUrl: true,
        githubUrl: true, linkedinUrl: true,
      },
    });
  }

  findAll() {
    return this.prisma.teamMember.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        assignments: { include: { project: { select: { id: true, name: true, status: true } } } },
      },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id },
      include: { assignments: { include: { project: true } } },
    });
    if (!member) throw new NotFoundException(`Team member ${id} not found`);
    return member;
  }

  create(dto: CreateMemberDto) {
    return this.prisma.teamMember.create({ data: dto });
  }

  async update(id: string, dto: UpdateMemberDto) {
    await this.findOne(id);
    return this.prisma.teamMember.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.teamMember.delete({ where: { id } });
    return { deleted: true };
  }
}
