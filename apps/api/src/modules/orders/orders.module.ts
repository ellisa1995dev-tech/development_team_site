import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { MailService } from '../../common/mail.service';
import { OrdersPublicController, OrdersAdminController } from './orders.controller';

@Module({
  controllers: [OrdersPublicController, OrdersAdminController],
  providers: [OrdersService, MailService],
})
export class OrdersModule {}
