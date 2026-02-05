import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServersModule } from './modules/servers/servers.module';
import { ChannelsModule } from './modules/channels/channels.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AuthModule,
    ServersModule,
    ChannelsModule,
  ],
})
export class AppModule {}
