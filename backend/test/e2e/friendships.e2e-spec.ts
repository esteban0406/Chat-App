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

  it('sends and accepts a friend request', async () => {
    const sender = await registerUser(httpServer);
    const receiver = await registerUser(httpServer);

    const sent = await request(httpServer)
      .post('/api/friendships')
      .set(authHeader(sender.accessToken))
      .send({ receiverId: receiver.user.id })
      .expect(201);

    const accepted = await request(httpServer)
      .patch(`/api/friendships/${sent.body.id}`)
      .set(authHeader(receiver.accessToken))
      .send({ status: 'ACCEPTED' })
      .expect(200);

    expect(accepted.body.status).toBe('ACCEPTED');

    const friends = await request(httpServer)
      .get('/api/friendships')
      .set(authHeader(sender.accessToken))
      .expect(200);

    expect(friends.body.some((user: any) => user.id === receiver.user.id)).toBe(
      true,
    );
  });
});
