import { Module } from '@nestjs/common';
import { ServerInvitesService } from './server-invites.service';
import { ServerInvitesController } from './server-invites.controller';
import { GatewayModule } from '../../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [ServerInvitesController],
  providers: [ServerInvitesService],
  exports: [ServerInvitesService],
})
export class ServerInvitesModule {}
