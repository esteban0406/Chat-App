import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServersModule } from './modules/servers/servers.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { LivekitModule } from './modules/livekit/livekit.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { HTTPLoggerMiddleware } from './common/logger.middleware';

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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HTTPLoggerMiddleware).forRoutes('*path');
  }
}
