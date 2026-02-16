import { test, expect } from '../helpers/fixtures';
import { createServer, getServerChannels, createChannel } from '../helpers/api';
import { resetDB } from '../helpers/db';

test.describe('Navigation flows', () => {
  test.beforeAll(async () => {
    await resetDB();
  });

  test('Home page loads after login', async ({ authenticated }) => {
    const { page } = authenticated;
    await page.goto('/home');
    await page.waitForURL('**/home**');

    await expect(page.getByText('Todos').first()).toBeVisible();
  });

  test('Tab navigation between friends sections', async ({ authenticated }) => {
    const { page } = authenticated;
    await page.goto('/home');
    await page.waitForURL('**/home**');

    // Todos tab (default)
    await expect(page.getByText('Todos').first()).toBeVisible();

    // Solicitudes de amistad
    await page.getByRole('link', { name: 'Solicitudes de amistad' }).or(page.getByText('Solicitudes de amistad')).first().click();
    await page.waitForURL('**/home/requests**');

    // Solicitudes a servidores
    await page.getByRole('link', { name: 'Solicitudes a servidores' }).or(page.getByText('Solicitudes a servidores')).first().click();
    await page.waitForURL('**/home/server-requests**');

    // Agregar amigos
    await page.getByRole('link', { name: 'Agregar amigos' }).or(page.getByText('Agregar amigos')).first().click();
    await page.waitForURL('**/home/add**');
  });

  test('Server sidebar navigation to home', async ({ authenticated }) => {
    const { page, session } = authenticated;
    await createServer(session.accessToken, 'Nav Server');

    await page.goto('/home');
    await page.reload();

    // Click home icon link
    await page.locator('a[href="/home"]').first().click();
    await page.waitForURL('**/home**');
    await expect(page).toHaveURL(/\/home/);
  });

  test('Server to channel navigation', async ({ authenticated }) => {
    const { page, session } = authenticated;
    const server = await createServer(session.accessToken, 'Channel Nav');
    const channels = await getServerChannels(session.accessToken, server.id);
    let channel = channels.find((c) => c.type === 'TEXT');
    if (!channel) {
      channel = await createChannel(session.accessToken, server.id, 'general', 'TEXT');
    }

    await page.goto(`/servers/${server.id}`);
    await page.waitForTimeout(1000);

    // Click the channel link
    await page.getByText(channel.name).first().click();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/channels\//);
  });

  test('Back to home from server view', async ({ authenticated }) => {
    const { page, session } = authenticated;
    const server = await createServer(session.accessToken, 'Back Home');

    await page.goto(`/servers/${server.id}`);
    await page.waitForTimeout(500);

    await page.locator('a[href="/home"]').first().click();
    await page.waitForURL('**/home**');
    await expect(page).toHaveURL(/\/home/);
  });
});
