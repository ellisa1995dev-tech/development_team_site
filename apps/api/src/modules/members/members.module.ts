import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersPublicController, MembersAdminController } from './members.controller';

@Module({
  controllers: [MembersPublicController, MembersAdminController],
  providers: [MembersService],
})
export class MembersModule {}
