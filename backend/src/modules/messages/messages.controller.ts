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

  @Get(':id')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.messagesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.update(id, req.user.id, updateMessageDto.content);
  }

  @Delete(':id')
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.messagesService.delete(id, req.user.id);
  }
}
