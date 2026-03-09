import { Module } from '@nestjs/common';
import { AiBotController } from './ai-bot.controller';
import { AiBotService } from './ai-bot.service';

@Module({
  controllers: [AiBotController],
  providers: [AiBotService],
})
export class AiBotModule {}
