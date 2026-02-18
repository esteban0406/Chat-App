import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
    MessagesModule,
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class GatewayModule {}
