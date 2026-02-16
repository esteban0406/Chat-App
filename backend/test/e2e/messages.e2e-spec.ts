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
import { createServerForUser } from './helpers/feature.helper';

describe('Messages Feature (e2e)', () => {
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

  it('creates a message and lists it by channel', async () => {
    const user = await registerUser(httpServer);
    const server = await createServerForUser(httpServer, user.accessToken);
    const channels = server.channels as { id: string }[];
    const channelId = channels[0].id;

    const created = await request(httpServer)
      .post('/api/messages')
      .set(authHeader(user.accessToken))
      .send({ channelId, content: 'Hello from e2e' })
      .expect(201);

    const createdBody = created.body as { id: string };
    expect(createdBody.id).toBeDefined();

    const list = await request(httpServer)
      .get(`/api/messages/channel/${channelId}`)
      .set(authHeader(user.accessToken))
      .expect(200);

    const listBody = list.body as { messages: { id: string }[] };
    expect(Array.isArray(listBody.messages)).toBe(true);
    expect(listBody.messages.some((msg) => msg.id === createdBody.id)).toBe(
      true,
    );
  });
});
