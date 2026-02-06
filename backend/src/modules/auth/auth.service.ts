import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };
  }

  async login(user: { id: string; email: string; username: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    // Update user status to ONLINE
    await this.usersService.updateStatus(user.id, 'ONLINE');

    return {
      user: await this.usersService.findOne(user.id),
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already in use');
      }
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        status: 'ONLINE',
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate token
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      user,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async logout(userId: string) {
    await this.usersService.updateStatus(userId, 'OFFLINE');
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    return this.usersService.findOne(userId);
  }
}
