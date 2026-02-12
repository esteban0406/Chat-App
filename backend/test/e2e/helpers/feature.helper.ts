import request from 'supertest';
import { authHeader } from './auth.helper';

export const createServerForUser = async (
  httpServer: any,
  token: string,
  name = 'Test Server',
) => {
  const res = await request(httpServer)
    .post('/api/servers')
    .set(authHeader(token))
    .send({ name })
    .expect(201);

  return res.body;
};

export const createChannelForServer = async (
  httpServer: any,
  token: string,
  serverId: string,
  name = 'new-channel',
  type: 'TEXT' | 'VOICE' = 'TEXT',
) => {
  const res = await request(httpServer)
    .post(`/api/servers/${serverId}/channels`)
    .set(authHeader(token))
    .send({ name, type })
    .expect(201);

  return res.body;
};
