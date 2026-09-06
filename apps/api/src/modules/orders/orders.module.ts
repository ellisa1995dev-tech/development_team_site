import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersPublicController, OrdersAdminController } from './orders.controller';

@Module({
  controllers: [OrdersPublicController, OrdersAdminController],
  providers: [OrdersService],
})
export class OrdersModule {}
