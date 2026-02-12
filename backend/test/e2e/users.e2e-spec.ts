import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/app.helper';
import {
  connectTestDatabase,
  disconnectTestDatabase,
  resetTestDatabase,
} from './helpers/db.helper';
import { authHeader, registerUser } from './helpers/auth.helper';

describe('Users Feature (e2e)', () => {
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

  it('searches users by username', async () => {
    const session = await registerUser(httpServer);

    const res = await request(httpServer)
      .get('/api/users/search')
      .query({ username: session.credentials.username.slice(0, 6) })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('updates own status', async () => {
    const session = await registerUser(httpServer);

    const res = await request(httpServer)
      .patch('/api/users/me/status')
      .set(authHeader(session.accessToken))
      .send({ status: 'OFFLINE' })
      .expect(200);

    expect(res.body.status).toBe('OFFLINE');
  });
});
