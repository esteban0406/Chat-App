import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LivekitService } from './livekit.service';
import { JoinRoomDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Post('join')
  async joinRoom(@Body() joinRoomDto: JoinRoomDto) {
    return this.livekitService.generateToken(
      joinRoomDto.identity,
      joinRoomDto.room,
    );
  }
}
