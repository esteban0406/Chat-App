import { Module } from '@nestjs/common';
import { ServersService } from './servers.service';
import { ServersController } from './servers.controller';
import { ServerInvitesModule } from './invites/server-invites.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [ServerInvitesModule, RolesModule],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService],
})
export class ServersModule {}
