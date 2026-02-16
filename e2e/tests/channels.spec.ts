import { test, expect, loginWithToken } from '../helpers/fixtures';
import { registerUser } from '../helpers/auth';
import { createServer, createChannel, getServerChannels } from '../helpers/api';
import { resetDB } from '../helpers/db';

test.describe.serial('Channel management', () => {
  let token: string;
  let serverId: string;

  test.beforeAll(async () => {
    await resetDB();
    const session = await registerUser();
    token = session.accessToken;
    const server = await createServer(token, 'Channel Test Server');
    serverId = server.id;
  });

  test('Create text channel via UI', async ({ page }) => {
    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    // Click "+" button near the text channels section header
    const sectionHeader = page.getByText(/canales de texto/i);
    await expect(sectionHeader).toBeVisible();
    const textSection = sectionHeader.locator('..');
    const addButton = textSection.locator('button').first();
    await addButton.click();

    // Fill channel name
    await page.getByPlaceholder(/general|nombre/i).fill('test-channel');
    await page.getByRole('button', { name: 'Crear' }).click();

    await page.waitForTimeout(1000);
    await expect(page.getByText('test-channel').first()).toBeVisible();
  });

  test('Navigate to text channel shows chat input', async ({ page }) => {
    const channels = await getServerChannels(token, serverId);
    let channel = channels.find((c) => c.type === 'TEXT');
    if (!channel) {
      channel = await createChannel(token, serverId, 'general', 'TEXT');
    }

    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}/channels/${channel.id}`);
    await page.waitForTimeout(1000);

    await expect(page.getByPlaceholder('Escribe un mensaje...')).toBeVisible();
  });

  test('Channel sidebar shows sections', async ({ page }) => {
    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    await expect(page.getByText(/canales de texto/i)).toBeVisible();
    await expect(page.getByText(/canales de voz/i)).toBeVisible();
  });

  test('Default general channel exists', async ({ page }) => {
    // Create a fresh server - it should have a default "general" channel
    const freshServer = await createServer(token, 'Fresh Server');

    await loginWithToken(page, token);
    await page.goto(`/servers/${freshServer.id}`);
    await page.waitForTimeout(1000);

    await expect(page.getByText('general').first()).toBeVisible();
  });

  test('Channel URL structure', async ({ page }) => {
    const channels = await getServerChannels(token, serverId);
    let channel = channels.find((c) => c.type === 'TEXT');
    if (!channel) {
      channel = await createChannel(token, serverId, 'url-test', 'TEXT');
    }

    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}/channels/${channel.id}`);

    await expect(page).toHaveURL(
      new RegExp(`/servers/${serverId}/channels/${channel.id}`),
    );
  });

  test('Delete channel', async ({ page }) => {
    const channel = await createChannel(token, serverId, 'delete-me', 'TEXT');

    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    // Hover channel row to reveal delete icon (go up 2 levels: span -> div -> div.group)
    const channelItem = page.getByText('delete-me').first();
    const channelRow = channelItem.locator('xpath=ancestor::div[contains(@class,"group")]');
    await channelRow.hover();
    await page.waitForTimeout(300);

    // Click delete icon within the row
    await channelRow.getByLabel('Eliminar canal').click();

    // Confirm in modal (exact match to avoid conflict with "Eliminar canal" aria-label)
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('delete-me')).toHaveCount(0);
  });

  test('Edit channel name', async ({ page }) => {
    const channel = await createChannel(token, serverId, 'edit-me', 'TEXT');

    await loginWithToken(page, token);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    // Hover channel row to reveal edit icon
    const channelItem = page.getByText('edit-me').first();
    const channelRow = channelItem.locator('xpath=ancestor::div[contains(@class,"group")]');
    await channelRow.hover();
    await page.waitForTimeout(300);

    // Click edit icon within the row
    await channelRow.getByLabel('Editar canal').click();

    // Clear and type new name in the edit modal
    const modal = page.locator('.fixed');
    const nameInput = modal.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('renamed-channel');

    await page.getByRole('button', { name: /guardar|actualizar/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('renamed-channel').first()).toBeVisible();
  });
});
