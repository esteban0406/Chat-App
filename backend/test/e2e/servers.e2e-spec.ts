import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp } from './helpers/app.helper';
import {
  connectTestDatabase,
  disconnectTestDatabase,
  resetTestDatabase,
} from './helpers/db.helper';
import { authHeader, registerUser } from './helpers/auth.helper';

describe('Servers Feature (e2e)', () => {
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

  it('creates a server and lists it for the owner', async () => {
    const owner = await registerUser(httpServer);

    const created = await request(httpServer)
      .post('/api/servers')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Backend Test Server' })
      .expect(201);

    expect(created.body.id).toBeDefined();
    expect(created.body.name).toBe('Backend Test Server');

    const list = await request(httpServer)
      .get('/api/servers')
      .set(authHeader(owner.accessToken))
      .expect(200);

    expect(list.body.some((server: any) => server.id === created.body.id)).toBe(
      true,
    );
  });

  it('allows another user to join by server id', async () => {
    const owner = await registerUser(httpServer);
    const member = await registerUser(httpServer);

    const created = await request(httpServer)
      .post('/api/servers')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Joinable Server' })
      .expect(201);

    const joined = await request(httpServer)
      .post(`/api/servers/${created.body.id}/join`)
      .set(authHeader(member.accessToken))
      .expect(201);

    expect(joined.body.id).toBe(created.body.id);
    expect(
      joined.body.members.some((m: any) => m.user.id === member.user.id),
    ).toBe(true);
  });
});
