import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/types';
import { CreateMessageDto, UpdateMessageDto } from './dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.create(req.user.id, createMessageDto);
  }

  @Get('channel/:channelId')
  async findAllForChannel(
    @Request() req: RequestWithUser,
    @Param('channelId') channelId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.messagesService.findAllForChannel(channelId, req.user.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get(':messageId')
  async findOne(
    @Request() req: RequestWithUser,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.findOne(messageId, req.user.id);
  }

  @Patch(':messageId')
  async update(
    @Request() req: RequestWithUser,
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.update(
      messageId,
      req.user.id,
      updateMessageDto.content,
    );
  }

  @Delete(':messageId')
  async delete(
    @Request() req: RequestWithUser,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.delete(messageId, req.user.id);
  }
}
