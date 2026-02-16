import http from 'http';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/app.helper';
import {
  connectTestDatabase,
  disconnectTestDatabase,
  resetTestDatabase,
} from './helpers/db.helper';
import { authHeader, registerUser } from './helpers/auth.helper';
import {
  createChannelForServer,
  createServerForUser,
} from './helpers/feature.helper';

describe('Channels Feature (e2e)', () => {
  let app: INestApplication;
  let httpServer: http.Server;

  beforeAll(async () => {
    await connectTestDatabase();
    app = await createTestApp();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await closeTestApp(app);
    await disconnectTestDatabase();
  });

  it('creates and lists channels for a server', async () => {
    const owner = await registerUser(httpServer);
    const server = await createServerForUser(httpServer, owner.accessToken);

    const createdChannel = await createChannelForServer(
      httpServer,
      owner.accessToken,
      server.id as string,
      'engineering',
    );

    expect(createdChannel.name).toBe('engineering');

    const channels = await request(httpServer)
      .get(`/api/servers/${server.id as string}/channels`)
      .set(authHeader(owner.accessToken))
      .expect(200);

    const channelList = channels.body as { id: string }[];
    expect(
      channelList.some((channel) => channel.id === createdChannel.id),
    ).toBe(true);
  });
});
