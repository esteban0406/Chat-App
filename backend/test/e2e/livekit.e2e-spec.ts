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

describe('Livekit Feature (e2e)', () => {
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

  it('generates a voice token for authenticated user', async () => {
    const session = await registerUser(httpServer);

    const res = await request(httpServer)
      .post('/api/voice/join')
      .set(authHeader(session.accessToken))
      .send({ identity: session.user.id, room: 'room-e2e' })
      .expect(201);

    const body = res.body as { token: string; url: string };
    expect(body.token).toBeDefined();
    expect(body.url).toBeDefined();
  });
});
