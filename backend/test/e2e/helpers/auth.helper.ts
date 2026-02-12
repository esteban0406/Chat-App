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
  httpServer: any,
  creds?: Partial<TestCredentials>,
): Promise<AuthSession> => {
  const credentials = { ...makeCredentials('auth'), ...(creds ?? {}) };

  const res = await request(httpServer)
    .post('/api/auth/register')
    .send(credentials)
    .expect(201);

  return {
    user: res.body.user,
    accessToken: res.body.accessToken,
    credentials,
  };
};

export const loginUser = async (
  httpServer: any,
  credentials: TestCredentials,
): Promise<AuthSession> => {
  const res = await request(httpServer)
    .post('/api/auth/login')
    .send({ email: credentials.email, password: credentials.password })
    .expect(201);

  return {
    user: res.body.user,
    accessToken: res.body.accessToken,
    credentials,
  };
};
