import { test, expect, loginWithToken } from '../helpers/fixtures';
import { registerUser } from '../helpers/auth';
import {
  createServer,
  sendFriendRequest,
  acceptFriendRequest,
  sendServerInvite,
  acceptServerInvite,
} from '../helpers/api';
import { resetDB } from '../helpers/db';

test.describe.serial('Server management', () => {
  let token: string;

  test.beforeAll(async () => {
    await resetDB();
    const session = await registerUser();
    token = session.accessToken;
  });

  test('Create server via UI', async ({ page }) => {
    await loginWithToken(page, token);

    // Click the dashed "+" button in server sidebar (has Plus SVG icon)
    const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
    await addButton.click();

    await page.getByPlaceholder('Nombre del servidor').fill('Mi Servidor');
    await page.getByRole('button', { name: 'Crear' }).click();

    await page.waitForURL('**/servers/**');
    await expect(page).toHaveURL(/\/servers\//);
  });

  test('Server appears in sidebar after creation', async ({ page }) => {
    await loginWithToken(page, token);

    const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
    await addButton.click();

    await page.getByPlaceholder('Nombre del servidor').fill('Visible Server');
    await page.getByRole('button', { name: 'Crear' }).click();
    await page.waitForURL('**/servers/**');

    // Verify server icon with first letter
    await expect(page.getByText('V').first()).toBeVisible();
  });

  test('Navigate to server created via API', async ({ page }) => {
    const server = await createServer(token, 'API Server');
    await loginWithToken(page, token);

    const serverLink = page.locator(`a[href*="/servers/${server.id}"]`).first();
    await expect(serverLink).toBeVisible();
    await serverLink.click();

    await expect(page).toHaveURL(new RegExp(`/servers/${server.id}`));
  });

  test('Delete server', async ({ page }) => {
    const server = await createServer(token, 'Delete Me');
    await loginWithToken(page, token);

    await page.goto(`/servers/${server.id}`);
    await page.waitForTimeout(1000);

    // Click the chevron dropdown button (Menu.Button with ChevronDown SVG)
    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);

    await page.getByText('Eliminar servidor').click();

    // Confirm in modal (exact match to avoid conflict with "Eliminar canal" aria-label)
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();

    await page.waitForURL('**/home**');
    await expect(page).toHaveURL(/\/home/);
  });

  test('Create server with description', async ({ page }) => {
    await loginWithToken(page, token);

    const addButton = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
    await addButton.click();

    await page.getByPlaceholder('Nombre del servidor').fill('Server Desc');
    const descInput = page.getByPlaceholder(/descripción/i);
    if (await descInput.isVisible()) {
      await descInput.fill('Una descripción de prueba');
    }
    await page.getByRole('button', { name: 'Crear' }).click();

    await page.waitForURL('**/servers/**');
    await expect(page).toHaveURL(/\/servers\//);
  });

  test('Multiple servers appear in sidebar', async ({ page }) => {
    await createServer(token, 'Alpha');
    await createServer(token, 'Beta');
    await createServer(token, 'Gamma');

    await loginWithToken(page, token);

    const serverLinks = page.locator('a[href*="/servers/"]');
    await expect(async () => {
      const count = await serverLinks.count();
      expect(count).toBeGreaterThanOrEqual(3);
    }).toPass({ timeout: 5000 });
  });

  test('Rename server via UI', async ({ page }) => {
    const server = await createServer(token, 'Old Name');
    await loginWithToken(page, token);
    await page.goto(`/servers/${server.id}`);
    await page.waitForTimeout(1000);

    // Open server dropdown
    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);

    await page.getByText('Cambiar nombre del servidor').click();
    await page.waitForTimeout(500);

    // Update name in modal (same pattern as 'Edit channel name' in channels.spec.ts)
    const modal = page.locator('.fixed');
    const nameInput = modal.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('Nuevo Nombre');

    await page.getByRole('button', { name: 'Guardar' }).click();
    await page.waitForTimeout(1000);

    // New name should appear in the sidebar header
    await expect(page.getByText('Nuevo Nombre').first()).toBeVisible();
  });

  test('"Cambiar nombre del servidor" not visible to non-owner member', async ({ page }) => {
    // Fresh users — same self-contained pattern as 'Assign member to role' in roles.spec.ts
    const owner = await registerUser();
    const member = await registerUser();
    const server = await createServer(owner.accessToken, 'RBAC Rename Server');

    // Invite member (requires friendship first)
    const friendship = await sendFriendRequest(owner.accessToken, member.user.id);
    await acceptFriendRequest(member.accessToken, friendship.id);
    const invite = await sendServerInvite(owner.accessToken, server.id, member.user.id);
    await acceptServerInvite(member.accessToken, invite.id);

    // Log in as the non-owner member (default Member role = no RENAME_SERVER permission)
    await loginWithToken(page, member.accessToken);
    await page.goto(`/servers/${server.id}`);
    await page.waitForTimeout(1000);

    // Since the member has no management permissions, the dropdown button itself
    // must not be rendered at all (entire menu is hidden for unprivileged users)
    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await expect(chevronBtn).toHaveCount(0);

    // Rename option must also not appear anywhere on the page
    await expect(page.getByText('Cambiar nombre del servidor')).toHaveCount(0);
  });
});
