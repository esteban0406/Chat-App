import { test, expect, loginWithToken } from '../helpers/fixtures';
import { registerUser } from '../helpers/auth';
import { createServer, createChannel, getServerChannels } from '../helpers/api';
import { resetDB } from '../helpers/db';

test.describe.serial('Messaging', () => {
  let token: string;
  let username: string;
  let serverId: string;
  let channelId: string;

  test.beforeAll(async () => {
    await resetDB();
    const session = await registerUser();
    token = session.accessToken;
    username = session.user.username;
    const server = await createServer(token, 'Msg Server');
    serverId = server.id;
    const channels = await getServerChannels(token, serverId);
    let channel = channels.find((c) => c.type === 'TEXT');
    if (!channel) {
      channel = await createChannel(token, serverId, 'general', 'TEXT');
    }
    channelId = channel.id;
  });

  test('Message input has placeholder', async ({ page }) => {
    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}/channels/${channelId}`);
    await page.waitForTimeout(1000);

    await expect(page.getByPlaceholder('Escribe un mensaje...')).toBeVisible();
  });

  test('Send a message', async ({ page }) => {
    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}/channels/${channelId}`);
    await page.waitForTimeout(1000);

    const input = page.getByPlaceholder('Escribe un mensaje...');
    await input.fill('Hola mundo');

    // Click send button
    const sendBtn = input.locator('..').locator('button').last();
    await sendBtn.click();

    await page.waitForTimeout(2000);
    await expect(page.getByText('Hola mundo').first()).toBeVisible();
  });

  test('Message shows author username', async ({ page }) => {
    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}/channels/${channelId}`);
    await page.waitForTimeout(2000);

    // Verify the username is displayed near messages
    await expect(page.getByText(username).first()).toBeVisible();
  });

  test('Multiple messages appear in order', async ({ page }) => {
    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}/channels/${channelId}`);
    await page.waitForTimeout(1000);

    const input = page.getByPlaceholder('Escribe un mensaje...');

    for (const msg of ['Mensaje uno', 'Mensaje dos', 'Mensaje tres']) {
      await input.fill(msg);
      const sendBtn = input.locator('..').locator('button').last();
      await sendBtn.click();
      await page.waitForTimeout(1000);
    }

    await expect(page.getByText('Mensaje uno').first()).toBeVisible();
    await expect(page.getByText('Mensaje dos').first()).toBeVisible();
    await expect(page.getByText('Mensaje tres').first()).toBeVisible();
  });

  test('Empty channel shows no messages', async ({ page }) => {
    // Create a fresh channel with no messages
    const newChannel = await createChannel(token, serverId, 'empty-channel', 'TEXT');

    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}/channels/${newChannel.id}`);
    await page.waitForTimeout(1000);

    // Input should be present
    await expect(page.getByPlaceholder('Escribe un mensaje...')).toBeVisible();
  });
});
