import { Module } from '@nestjs/common';
import { ServerInvitesService } from './server-invites.service';
import { ServerInvitesController } from './server-invites.controller';

@Module({
  controllers: [ServerInvitesController],
  providers: [ServerInvitesService],
  exports: [ServerInvitesService],
})
export class ServerInvitesModule {}
