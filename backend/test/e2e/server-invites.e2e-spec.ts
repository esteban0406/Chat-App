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

describe('Server Invites Feature (e2e)', () => {
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

  it('sends and accepts a server invite', async () => {
    const owner = await registerUser(httpServer);
    const receiver = await registerUser(httpServer);
    const server = await createServerForUser(httpServer, owner.accessToken);

    const invite = await request(httpServer)
      .post(`/api/server-invites/server/${server.id as string}`)
      .set(authHeader(owner.accessToken))
      .send({ receiverId: receiver.user.id })
      .expect(201);

    const inviteBody = invite.body as { id: string };

    const accepted = await request(httpServer)
      .post(`/api/server-invites/${inviteBody.id}/accept`)
      .set(authHeader(receiver.accessToken))
      .expect(201);

    const acceptedBody = accepted.body as { id: string };
    expect(acceptedBody.id).toBe(server.id);
  });
});
