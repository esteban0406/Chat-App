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

  it('sends and accepts a server invite', async () => {
    const owner = await registerUser(httpServer);
    const receiver = await registerUser(httpServer);
    const server = await createServerForUser(httpServer, owner.accessToken);

    const invite = await request(httpServer)
      .post(`/api/server-invites/server/${server.id}`)
      .set(authHeader(owner.accessToken))
      .send({ receiverId: receiver.user.id })
      .expect(201);

    const accepted = await request(httpServer)
      .post(`/api/server-invites/${invite.body.id}/accept`)
      .set(authHeader(receiver.accessToken))
      .expect(201);

    expect(accepted.body.id).toBe(server.id);
  });
});
