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
import {
  PERMISSION_KEY,
  SERVER_ID_SOURCE_KEY,
  ServerIdSource,
} from './require-permission.decorator';

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

    const serverIdSource = this.reflector.get<ServerIdSource>(
      SERVER_ID_SOURCE_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest<
      RequestWithUser & {
        params: Record<string, string>;
        body: Record<string, unknown>;
      }
    >();
    const userId = request.user.id;

    const serverId = await this.resolveServerId(request, serverIdSource);

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

  private async resolveServerId(
    request: RequestWithUser & {
      params: Record<string, string>;
      body: Record<string, unknown>;
    },
    source: ServerIdSource,
  ): Promise<string> {
    if (source.from === 'params') {
      return request.params[source.field];
    }

    if (source.from === 'body') {
      return request.body[source.field] as string;
    }

    if (source.from === 'channel') {
      const channelId = request.params[source.field];
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        throw new NotFoundException('Channel not found');
      }

      return channel.serverId;
    }

    throw new ForbiddenException('Unable to resolve server context');
  }
}
