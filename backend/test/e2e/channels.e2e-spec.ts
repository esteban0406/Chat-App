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
  let httpServer: any;

  beforeAll(async () => {
    await connectTestDatabase();
    app = await createTestApp();
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
      server.id,
      'engineering',
    );

    expect(createdChannel.name).toBe('engineering');

    const channels = await request(httpServer)
      .get(`/api/servers/${server.id}/channels`)
      .set(authHeader(owner.accessToken))
      .expect(200);

    expect(
      channels.body.some((channel: any) => channel.id === createdChannel.id),
    ).toBe(true);
  });
});
