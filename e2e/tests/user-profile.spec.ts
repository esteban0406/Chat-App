import { test, expect, loginWithToken } from '../helpers/fixtures';
import { registerUser } from '../helpers/auth';
import { resetDB } from '../helpers/db';
import path from 'path';
import fs from 'fs';

test.describe.serial('User profile', () => {
  test.beforeAll(async () => {
    await resetDB();
  });

  test('User profile shows username', async ({ page }) => {
    const session = await registerUser();
    await loginWithToken(page, session.accessToken);

    await expect(page.getByText(session.user.username).first()).toBeVisible();
  });

  test('Edit username', async ({ page }) => {
    const session = await registerUser();
    await loginWithToken(page, session.accessToken);

    // Click settings menu in profile bar
    const gearButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
    await gearButton.click();
    await page.waitForTimeout(300);

    await page.getByText('Editar nombre').click();
    await page.waitForTimeout(300);

    // Fill new name in the modal input (not the sidebar search)
    const dialog = page.locator('[role="dialog"], [class*="modal"], .fixed');
    const nameInput = dialog.locator('input').first();
    const newName = `Nuevo_${Date.now()}`;
    await nameInput.clear();
    await nameInput.fill(newName);
    await page.getByRole('button', { name: 'Guardar' }).click();

    await page.waitForTimeout(1000);
    await expect(page.getByText(newName).first()).toBeVisible();
  });

  test('Edit username validation - empty name', async ({ page }) => {
    const session = await registerUser();
    await loginWithToken(page, session.accessToken);

    const gearButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
    await gearButton.click();
    await page.waitForTimeout(300);

    await page.getByText('Editar nombre').click();
    await page.waitForTimeout(300);

    const dialog = page.locator('[role="dialog"], [class*="modal"], .fixed');
    const nameInput = dialog.locator('input').first();
    await nameInput.clear();
    await page.getByRole('button', { name: 'Guardar' }).click();

    await page.waitForTimeout(500);
    await expect(
      page.getByText(/no puede estar vac/i).first(),
    ).toBeVisible();
  });

  test('Edit username validation - same name', async ({ page }) => {
    const session = await registerUser();
    await loginWithToken(page, session.accessToken);

    const gearButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
    await gearButton.click();
    await page.waitForTimeout(300);

    await page.getByText('Editar nombre').click();

    // Submit without changing
    await page.getByRole('button', { name: 'Guardar' }).click();

    await page.waitForTimeout(500);
    await expect(
      page.getByText(/nombre diferente/i).first(),
    ).toBeVisible();
  });

  test('Edit avatar', async ({ page }) => {
    const session = await registerUser();
    await loginWithToken(page, session.accessToken);

    const gearButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
    await gearButton.click();
    await page.waitForTimeout(300);

    await page.getByText('Editar avatar').click();

    // Create a small test PNG file
    const testImgPath = path.join(__dirname, 'test-avatar.png');
    // 1x1 transparent PNG
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64',
    );
    fs.writeFileSync(testImgPath, pngBuffer);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImgPath);

    await page.getByRole('button', { name: 'Guardar' }).click();
    await page.waitForTimeout(2000);

    // Cleanup
    fs.unlinkSync(testImgPath);
  });
});
