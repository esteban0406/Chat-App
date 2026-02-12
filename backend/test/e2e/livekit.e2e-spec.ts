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

  it('generates a voice token for authenticated user', async () => {
    const session = await registerUser(httpServer);

    const res = await request(httpServer)
      .post('/api/voice/join')
      .set(authHeader(session.accessToken))
      .send({ identity: session.user.id, room: 'room-e2e' })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.url).toBeDefined();
  });
});
