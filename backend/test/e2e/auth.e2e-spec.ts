import http from 'http';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/app.helper';
import {
  connectTestDatabase,
  disconnectTestDatabase,
  resetTestDatabase,
} from './helpers/db.helper';
import { authHeader, loginUser, registerUser } from './helpers/auth.helper';

describe('Auth Feature (e2e)', () => {
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

  it('registers, logs in, and reads profile', async () => {
    const session = await registerUser(httpServer);

    expect(session.accessToken).toBeDefined();
    expect(session.user.email).toBe(session.credentials.email);

    const logged = await loginUser(httpServer, session.credentials);

    const me = await request(httpServer)
      .get('/api/auth/me')
      .set(authHeader(logged.accessToken))
      .expect(200);

    const meBody = me.body as { id: string; email: string };
    expect(meBody.id).toBe(logged.user.id);
    expect(meBody.email).toBe(session.credentials.email);
  });
});
