const API_URL = 'http://localhost:4000';

let counter = 0;

export type TestCredentials = {
  email: string;
  username: string;
  password: string;
};

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

export function makeCredentials(prefix = 'user'): TestCredentials {
  counter += 1;
  const unique = `${Date.now()}_${counter}`;
  return {
    email: `${prefix}_${unique}@test.com`,
    username: `${prefix}_${unique}`,
    password: 'password123',
  };
}

export async function registerUser(
  creds?: Partial<TestCredentials>,
): Promise<AuthSession> {
  const credentials = { ...makeCredentials('e2e'), ...(creds ?? {}) };

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Register failed (${res.status}): ${body}`);
  }

  const body = (await res.json()) as { user: AuthUser; accessToken: string };
  return { user: body.user, accessToken: body.accessToken, credentials };
}

export async function loginUser(
  credentials: Pick<TestCredentials, 'email' | 'password'>,
): Promise<AuthSession> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }

  const body = (await res.json()) as { user: AuthUser; accessToken: string };
  return {
    user: body.user,
    accessToken: body.accessToken,
    credentials: { ...credentials, username: body.user.username },
  };
}
