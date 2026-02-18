import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { MessageDto } from './dto';

interface SocketWithData extends Socket {
  data: {
    userId?: string;
    channelId?: string;
  };
}

interface JwtPayload {
  sub: string;
  id?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: SocketWithData) {
    console.log('Client connected:', client.id);

    const token = client.handshake?.query?.token;
    if (token && typeof token === 'string') {
      try {
        const decoded = this.jwtService.verify<JwtPayload>(token);
        client.data = client.data || {};
        client.data.userId = decoded.sub || decoded.id;

        await client.join(`user:${client.data.userId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.warn('Invalid socket token:', message);
      }
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: MessageDto) {
    try {
      const { channelId, senderId, text } = data;

      if (!channelId || !senderId || !text) {
        console.warn('Ignoring message with missing fields');
        return;
      }

      const message = await this.messagesService.create(senderId, {
        channelId,
        content: text,
      });

      this.server.to(channelId).emit('message', {
        id: message.id,
        content: message.content,
        channelId: message.channelId,
        authorId: message.authorId,
        author: message.author,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() channelId: string,
  ) {
    if (!channelId) {
      return false;
    }

    await client.join(channelId);
    client.data = client.data || {};
    client.data.channelId = channelId;

    return true;
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() client: SocketWithData,
    @MessageBody() channelId?: string,
  ) {
    const activeChannel = client.data?.channelId;
    const targetChannel = channelId || activeChannel;

    if (!targetChannel) {
      return false;
    }

    try {
      await client.leave(targetChannel);
    } catch {
      return false;
    }

    if (client.data && client.data.channelId === targetChannel) {
      delete client.data.channelId;
    }

    return true;
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToChannel(channelId: string, event: string, data: unknown) {
    this.server.to(channelId).emit(event, data);
  }

  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
