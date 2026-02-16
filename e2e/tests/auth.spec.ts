import { test, expect, loginViaUI } from '../helpers/fixtures';
import { registerUser, makeCredentials } from '../helpers/auth';
import { resetDB } from '../helpers/db';

test.describe.serial('Authentication flows', () => {
  test.beforeAll(async () => {
    await resetDB();
  });

  test('Register new user successfully', async ({ page }) => {
    const creds = makeCredentials('register');

    await page.goto('/signup');
    await page.getByPlaceholder('Nombre de usuario').fill(creds.username);
    await page.getByPlaceholder('Correo electrónico').fill(creds.email);
    await page.getByPlaceholder('Contraseña').fill(creds.password);
    await page.getByRole('button', { name: 'Registrarse' }).click();

    await page.waitForURL('**/home**');
    await expect(page).toHaveURL(/\/home/);
  });

  test('Register validation error on empty form', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: 'Registrarse' }).click();

    await expect(page).toHaveURL(/\/signup/);
  });

  test('Register with duplicate email shows error', async ({ page }) => {
    const creds = makeCredentials('dup');
    await registerUser(creds);

    await page.goto('/signup');
    await page.getByPlaceholder('Nombre de usuario').fill('another_user');
    await page.getByPlaceholder('Correo electrónico').fill(creds.email);
    await page.getByPlaceholder('Contraseña').fill(creds.password);
    await page.getByRole('button', { name: 'Registrarse' }).click();

    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/signup/);
  });

  test('Login with valid credentials', async ({ page }) => {
    const session = await registerUser();

    await page.goto('/login');
    await page.getByPlaceholder('Correo electrónico').fill(session.credentials.email);
    await page.getByPlaceholder('Contraseña').fill(session.credentials.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL('**/home**');
    await expect(page).toHaveURL(/\/home/);
  });

  test('Login with wrong password shows error', async ({ page }) => {
    const session = await registerUser();

    await page.goto('/login');
    await page.getByPlaceholder('Correo electrónico').fill(session.credentials.email);
    await page.getByPlaceholder('Contraseña').fill('wrongpassword999');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('Login validation error on empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('Logout redirects to login', async ({ page }) => {
    const session = await registerUser();
    await loginViaUI(page, session.credentials.email, session.credentials.password);

    // Click the settings gear icon (headlessui Menu.Button with Settings SVG)
    const gearButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings') });
    await gearButton.click();
    await page.waitForTimeout(300);

    await page.getByText('Cerrar sesión').click();

    await page.waitForURL('**/login**');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/home');
    await page.waitForURL('**/login**');
    await expect(page).toHaveURL(/\/login/);
  });
});
