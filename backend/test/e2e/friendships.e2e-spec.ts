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

describe('Friendships Feature (e2e)', () => {
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

  it('sends and accepts a friend request', async () => {
    const sender = await registerUser(httpServer);
    const receiver = await registerUser(httpServer);

    const sent = await request(httpServer)
      .post('/api/friendships')
      .set(authHeader(sender.accessToken))
      .send({ receiverId: receiver.user.id })
      .expect(201);

    const sentBody = sent.body as { id: string };

    const accepted = await request(httpServer)
      .patch(`/api/friendships/${sentBody.id}`)
      .set(authHeader(receiver.accessToken))
      .send({ status: 'ACCEPTED' })
      .expect(200);

    const acceptedBody = accepted.body as { status: string };
    expect(acceptedBody.status).toBe('ACCEPTED');

    const friends = await request(httpServer)
      .get('/api/friendships')
      .set(authHeader(sender.accessToken))
      .expect(200);

    const friendList = friends.body as { id: string }[];
    expect(friendList.some((user) => user.id === receiver.user.id)).toBe(true);
  });
});
