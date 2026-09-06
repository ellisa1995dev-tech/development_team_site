import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './orders.dto';
import { AdminGuard } from '../auth/admin.guard';
import { UserGuard, type UserTokenPayload } from '../users/user.guard';

@Controller('orders')
export class OrdersPublicController {
  constructor(private readonly orders: OrdersService) {}

  /** Requires a registered account — the guard rejects anonymous posts. */
  @Post()
  @UseGuards(UserGuard)
  create(@Body() dto: CreateOrderDto, @Req() req: Request & { user?: UserTokenPayload }) {
    return this.orders.create(dto, req.user!.sub);
  }
}

@Controller('admin/orders')
@UseGuards(AdminGuard)
export class OrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get() list(@Query('status') status?: OrderStatus) { return this.orders.findAll(status); }
  @Get(':id') get(@Param('id') id: string) { return this.orders.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateOrderDto) { return this.orders.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.orders.remove(id); }
}
