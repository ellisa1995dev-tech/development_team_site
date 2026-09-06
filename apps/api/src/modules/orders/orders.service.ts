import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './orders.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, userId: string) {
    const order = await this.prisma.projectOrder.create({ data: { ...dto, userId } });
    // Only echo back what the sender already knows.
    return { id: order.id, createdAt: order.createdAt };
  }

  findAll(status?: OrderStatus) {
    return this.prisma.projectOrder.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, fullName: true, email: true, company: true } } },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.projectOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.projectOrder.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.projectOrder.delete({ where: { id } });
    return { deleted: true };
  }
}
