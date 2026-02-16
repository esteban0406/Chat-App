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

describe('Servers Feature (e2e)', () => {
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

  it('creates a server and lists it for the owner', async () => {
    const owner = await registerUser(httpServer);

    const created = await request(httpServer)
      .post('/api/servers')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Backend Test Server' })
      .expect(201);

    const createdBody = created.body as { id: string; name: string };
    expect(createdBody.id).toBeDefined();
    expect(createdBody.name).toBe('Backend Test Server');

    const list = await request(httpServer)
      .get('/api/servers')
      .set(authHeader(owner.accessToken))
      .expect(200);

    const serverList = list.body as { id: string }[];
    expect(serverList.some((server) => server.id === createdBody.id)).toBe(
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

    const createdBody = created.body as { id: string };

    const joined = await request(httpServer)
      .post(`/api/servers/${createdBody.id}/join`)
      .set(authHeader(member.accessToken))
      .expect(201);

    const joinedBody = joined.body as {
      id: string;
      members: { user: { id: string } }[];
    };
    expect(joinedBody.id).toBe(createdBody.id);
    expect(joinedBody.members.some((m) => m.user.id === member.user.id)).toBe(
      true,
    );
  });
});
