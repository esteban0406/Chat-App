import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ServersModule } from './modules/servers/servers.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { LivekitModule } from './modules/livekit/livekit.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { HTTPLoggerMiddleware } from './common/middleware/logger.middleware';
import { TestModule } from './test-utils/test.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minute window
        limit: process.env.NODE_ENV === 'test' ? 1200 : 120,
      },
    ]),
    ...(process.env.NODE_ENV === 'test' ? [TestModule] : []),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ServersModule,
    ChannelsModule,
    MessagesModule,
    LivekitModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HTTPLoggerMiddleware).forRoutes('*path');
  }
}
