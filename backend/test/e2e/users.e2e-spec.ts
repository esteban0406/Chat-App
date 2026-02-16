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

describe('Users Feature (e2e)', () => {
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

  it('searches users by username', async () => {
    const session = await registerUser(httpServer);

    const res = await request(httpServer)
      .get('/api/users/search')
      .query({ username: session.credentials.username.slice(0, 6) })
      .expect(200);

    const body = res.body as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('updates own status', async () => {
    const session = await registerUser(httpServer);

    const res = await request(httpServer)
      .patch('/api/users/me/status')
      .set(authHeader(session.accessToken))
      .send({ status: 'OFFLINE' })
      .expect(200);

    const body = res.body as { status: string };
    expect(body.status).toBe('OFFLINE');
  });
});
