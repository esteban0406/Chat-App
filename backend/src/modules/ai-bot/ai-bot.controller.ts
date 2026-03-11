import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/types';
import { AiBotService } from './ai-bot.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('ai-bot')
@UseGuards(JwtAuthGuard)
export class AiBotController {
  constructor(private readonly aiBotService: AiBotService) {}

  @Post('chat')
  async chat(
    @Request() req: RequestWithUser,
    @Body() chatMessageDto: ChatMessageDto,
  ): Promise<{ reply: string }> {
    const reply = await this.aiBotService.chat(
      req.user,
      chatMessageDto.message,
    );
    return { reply };
  }
}
