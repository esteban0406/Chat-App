import { Controller, Post, HttpCode } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('test')
export class TestController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reset')
  @HttpCode(200)
  async resetDatabase() {
    await this.prisma.$transaction([
      this.prisma.message.deleteMany(),
      this.prisma.channel.deleteMany(),
      this.prisma.member.deleteMany(),
      this.prisma.role.deleteMany(),
      this.prisma.serverInvite.deleteMany(),
      this.prisma.friendship.deleteMany(),
      this.prisma.account.deleteMany(),
      this.prisma.server.deleteMany(),
      this.prisma.user.deleteMany(),
    ]);
  }
}
