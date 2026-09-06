import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './orders.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('orders')
export class OrdersPublicController {
  constructor(private readonly orders: OrdersService) {}

  /** Public: the "order a project" form posts here. */
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
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
