import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/app.helper';
import {
  connectTestDatabase,
  disconnectTestDatabase,
  resetTestDatabase,
} from './helpers/db.helper';
import { authHeader, registerUser } from './helpers/auth.helper';
import { createServerForUser } from './helpers/feature.helper';

describe('Messages Feature (e2e)', () => {
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

  it('creates a message and lists it by channel', async () => {
    const user = await registerUser(httpServer);
    const server = await createServerForUser(httpServer, user.accessToken);
    const channelId = server.channels[0].id;

    const created = await request(httpServer)
      .post('/api/messages')
      .set(authHeader(user.accessToken))
      .send({ channelId, content: 'Hello from e2e' })
      .expect(201);

    expect(created.body.id).toBeDefined();

    const list = await request(httpServer)
      .get(`/api/messages/channel/${channelId}`)
      .set(authHeader(user.accessToken))
      .expect(200);

    expect(Array.isArray(list.body.messages)).toBe(true);
    expect(
      list.body.messages.some((msg: any) => msg.id === created.body.id),
    ).toBe(true);
  });
});
