import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto';
import type { RequestWithUser } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({
    default: {
      ttl: 60_000,
      limit: process.env.NODE_ENV === 'test' ? 1000 : 10,
    },
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({
    default: {
      ttl: 60_000,
      limit: process.env.NODE_ENV === 'test' ? 1000 : 10,
    },
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: RequestWithUser) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    return this.authService.getProfile(req.user.id);
  }
}
