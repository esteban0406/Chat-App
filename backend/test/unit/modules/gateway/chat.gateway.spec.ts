jest.mock('../../../../src/database/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket, Server } from 'socket.io';
import { ChatGateway } from '../../../../src/modules/gateway/chat.gateway';
import { MessagesService } from '../../../../src/modules/messages/messages.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  const jwtService = { verify: jest.fn() };
  const messagesService = { create: jest.fn() };

  const mockEmit = jest.fn();
  const mockTo = jest.fn(() => ({ emit: mockEmit }));
  const mockServer = { to: mockTo, emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: MessagesService, useValue: messagesService },
      ],
    }).compile();

    gateway = module.get(ChatGateway);
    gateway.server = mockServer as unknown as Server;
    jest.clearAllMocks();
  });

  const makeClient = (overrides: Record<string, unknown> = {}): Socket =>
    ({
      id: 'socket-1',
      handshake: { query: {} },
      data: {},
      join: jest.fn(),
      leave: jest.fn(),
      ...overrides,
    }) as unknown as Socket;

  describe('handleConnection', () => {
    it('authenticates client with valid token and joins user room', async () => {
      const client = makeClient({
        handshake: { query: { token: 'valid-token' } },
      });
      jwtService.verify.mockReturnValue({ sub: 'u1' });

      await gateway.handleConnection(client);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(client.data.userId).toBe('u1');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(client.join).toHaveBeenCalledWith('user:u1');
    });

    it('uses decoded.id when sub is missing', async () => {
      const client = makeClient({
        handshake: { query: { token: 'valid-token' } },
      });
      jwtService.verify.mockReturnValue({ id: 'u2' });

      await gateway.handleConnection(client);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(client.data.userId).toBe('u2');
    });

    it('handles missing token gracefully', async () => {
      const client = makeClient();
      await gateway.handleConnection(client);
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('handles invalid token without crashing', async () => {
      const client = makeClient({
        handshake: { query: { token: 'bad-token' } },
      });
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(gateway.handleConnection(client)).resolves.toBeUndefined();
    });
  });

  describe('handleDisconnect', () => {
    it('completes without error', () => {
      const client = makeClient();
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('handleMessage', () => {
    it('creates message and emits to channel', async () => {
      const msg = {
        id: 'm1',
        content: 'hello',
        channelId: 'c1',
        authorId: 'u1',
        author: { id: 'u1' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      messagesService.create.mockResolvedValue(msg);

      await gateway.handleMessage({
        channelId: 'c1',
        senderId: 'u1',
        text: 'hello',
      });

      expect(messagesService.create).toHaveBeenCalledWith('u1', {
        channelId: 'c1',
        content: 'hello',
      });
      expect(mockTo).toHaveBeenCalledWith('c1');
      expect(mockEmit).toHaveBeenCalledWith(
        'message',
        expect.objectContaining({ id: 'm1' }),
      );
    });

    it('returns early when fields are missing', async () => {
      await gateway.handleMessage({ channelId: 'c1' });
      expect(messagesService.create).not.toHaveBeenCalled();
    });

    it('catches errors from messagesService', async () => {
      messagesService.create.mockRejectedValue(new Error('db error'));

      await expect(
        gateway.handleMessage({
          channelId: 'c1',
          senderId: 'u1',
          text: 'hello',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('handleJoinChannel', () => {
    it('joins channel room and stores in client.data', async () => {
      const client = makeClient();
      const result = await gateway.handleJoinChannel(client, 'c1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(client.join).toHaveBeenCalledWith('c1');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(client.data.channelId).toBe('c1');
      expect(result).toBe(true);
    });

    it('returns false when channelId is empty', async () => {
      const client = makeClient();
      const result = await gateway.handleJoinChannel(client, '');
      expect(result).toBe(false);
    });
  });

  describe('handleLeaveChannel', () => {
    it('leaves explicit channel', async () => {
      const client = makeClient({ data: { channelId: 'c1' } });
      const result = await gateway.handleLeaveChannel(client, 'c1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(client.leave).toHaveBeenCalledWith('c1');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(client.data.channelId).toBeUndefined();
      expect(result).toBe(true);
    });

    it('leaves stored channel when no channelId given', async () => {
      const client = makeClient({ data: { channelId: 'c2' } });
      const result = await gateway.handleLeaveChannel(client);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(client.leave).toHaveBeenCalledWith('c2');
      expect(result).toBe(true);
    });

    it('returns false when no channel is available', async () => {
      const client = makeClient({ data: {} });
      const result = await gateway.handleLeaveChannel(client);
      expect(result).toBe(false);
    });

    it('returns false when leave throws', async () => {
      const client = makeClient({ data: { channelId: 'c1' } });
      (client.leave as jest.Mock).mockRejectedValue(new Error('leave error'));

      const result = await gateway.handleLeaveChannel(client, 'c1');
      expect(result).toBe(false);
    });
  });

  describe('emitToUser', () => {
    it('emits to correct user room', () => {
      gateway.emitToUser('u1', 'test-event', { foo: 'bar' });
      expect(mockTo).toHaveBeenCalledWith('user:u1');
      expect(mockEmit).toHaveBeenCalledWith('test-event', { foo: 'bar' });
    });
  });

  describe('emitToChannel', () => {
    it('emits to correct channel room', () => {
      gateway.emitToChannel('c1', 'test-event', { foo: 'bar' });
      expect(mockTo).toHaveBeenCalledWith('c1');
      expect(mockEmit).toHaveBeenCalledWith('test-event', { foo: 'bar' });
    });
  });

  describe('broadcast', () => {
    it('emits to all', () => {
      gateway.broadcast('test-event', { foo: 'bar' });
      expect(mockServer.emit).toHaveBeenCalledWith('test-event', {
        foo: 'bar',
      });
    });
  });
});
