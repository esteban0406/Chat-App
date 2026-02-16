import { test as base, type Page } from '@playwright/test';
import { registerUser, type AuthSession } from './auth';
import { createServer, createChannel, getServerChannels } from './api';
import { resetDB } from './db';

type AuthenticatedPage = {
  page: Page;
  session: AuthSession;
};

type TwoUsersFixture = {
  userA: AuthSession;
  userB: AuthSession;
};

type ServerWithChannel = {
  session: AuthSession;
  server: { id: string; name: string };
  channel: { id: string; name: string; type: string };
};

export const test = base.extend<{
  authenticated: AuthenticatedPage;
  twoUsers: TwoUsersFixture;
  serverWithChannel: ServerWithChannel;
  cleanDB: void;
}>({
  cleanDB: [
    async ({}, use) => {
      await resetDB();
      await use();
    },
    { auto: false },
  ],

  authenticated: async ({ page }, use) => {
    const session = await registerUser();
    // Set token in localStorage before navigating
    await page.addInitScript((token: string) => {
      window.localStorage.setItem('accessToken', token);
    }, session.accessToken);
    await use({ page, session });
  },

  twoUsers: async ({}, use) => {
    const userA = await registerUser();
    const userB = await registerUser();
    await use({ userA, userB });
  },

  serverWithChannel: async ({}, use) => {
    const session = await registerUser();
    const server = await createServer(session.accessToken, 'Test Server');
    // Get the default channel or create one
    const channels = await getServerChannels(session.accessToken, server.id);
    let channel = channels.find((c) => c.type === 'TEXT');
    if (!channel) {
      channel = await createChannel(
        session.accessToken,
        server.id,
        'general',
        'TEXT',
      );
    }
    await use({ session, server, channel });
  },
});

export { expect } from '@playwright/test';

/** Helper to login via UI - useful for auth flow tests */
export async function loginViaUI(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('Correo electrónico').fill(email);
  await page.getByPlaceholder('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/home**');
}

/** Helper to set auth token and navigate */
export async function loginWithToken(
  page: Page,
  token: string,
): Promise<void> {
  await page.addInitScript((t: string) => {
    window.localStorage.setItem('accessToken', t);
  }, token);
  await page.goto('/home');
  await page.waitForURL('**/home**');
}
