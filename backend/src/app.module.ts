import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServersModule } from './modules/servers/servers.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { LivekitModule } from './modules/livekit/livekit.module';
import { GatewayModule } from './modules/gateway/gateway.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    ServersModule,
    ChannelsModule,
    MessagesModule,
    LivekitModule,
    GatewayModule,
  ],
})
export class AppModule {}
