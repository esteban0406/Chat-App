import http from 'http';
import request from 'supertest';
import { makeCredentials, TestCredentials } from './factory.helper';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  credentials: TestCredentials;
};

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const registerUser = async (
  httpServer: http.Server,
  creds?: Partial<TestCredentials>,
): Promise<AuthSession> => {
  const credentials = { ...makeCredentials('auth'), ...(creds ?? {}) };

  const res = await request(httpServer)
    .post('/api/auth/register')
    .send(credentials)
    .expect(201);

  const body = res.body as { user: AuthUser; accessToken: string };
  return {
    user: body.user,
    accessToken: body.accessToken,
    credentials,
  };
};

export const loginUser = async (
  httpServer: http.Server,
  credentials: TestCredentials,
): Promise<AuthSession> => {
  const res = await request(httpServer)
    .post('/api/auth/login')
    .send({ email: credentials.email, password: credentials.password })
    .expect(201);

  const body = res.body as { user: AuthUser; accessToken: string };
  return {
    user: body.user,
    accessToken: body.accessToken,
    credentials,
  };
};
