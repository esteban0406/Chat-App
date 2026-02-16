import { test, expect, loginWithToken } from '../helpers/fixtures';
import { registerUser } from '../helpers/auth';
import { createServer } from '../helpers/api';
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
});
