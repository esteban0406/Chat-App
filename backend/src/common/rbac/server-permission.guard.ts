import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { ServerPermission } from '../../generated/prisma/client';
import type { RequestWithUser } from '../../modules/auth/types';
import { PERMISSION_KEY } from './require-permission.decorator';

@Injectable()
export class ServerPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<ServerPermission>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!permission) return true;

    const request = context.switchToHttp().getRequest<
      RequestWithUser & {
        params: Record<string, string>;
      }
    >();
    const userId = request.user.id;
    const serverId = request.params.serverId;

    // Owner always has full access
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException('Server not found');
    }

    if (server.ownerId === userId) {
      return true;
    }

    // Check member's role permissions
    const member = await this.prisma.member.findUnique({
      where: { userId_serverId: { userId, serverId } },
      include: { role: true },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }

    if (!member.role || !member.role.permissions.includes(permission)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
