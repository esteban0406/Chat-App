import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto, SearchUserDto, UpdateStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  async search(@Query() searchDto: SearchUserDto) {
    return this.usersService.findByUsername(searchDto.username);
  }

  // Protected /me endpoints - must be before :id routes
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: RequestWithUser) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/status')
  async updateMyStatus(
    @Request() req: RequestWithUser,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.usersService.updateStatus(req.user.id, updateStatusDto.status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/avatar')
  async getAvatar(@Param('id') id: string, @Res() res: Response) {
    const user = await this.usersService.findOne(id);

    if (!user.avatarUrl) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    // Redirect to the avatar URL (Cloudinary)
    return res.redirect(user.avatarUrl);
  }
}
