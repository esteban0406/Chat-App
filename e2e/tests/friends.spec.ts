import { test, expect, loginWithToken } from '../helpers/fixtures';
import { registerUser } from '../helpers/auth';
import { sendFriendRequest, acceptFriendRequest } from '../helpers/api';
import { resetDB } from '../helpers/db';

test.describe.serial('Friend management', () => {
  test.beforeAll(async () => {
    await resetDB();
  });

  test('Search and send friend request', async ({ page }) => {
    const userA = await registerUser();
    const userB = await registerUser();

    await loginWithToken(page, userA.accessToken);
    await page.goto('/home/add');
    await page.waitForURL('**/home/add**');

    // Search for user B using the "Nombre de usuario" input in the main content area
    await page.getByPlaceholder('Nombre de usuario').fill(userB.user.username);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForTimeout(1000);

    // Wait for results
    await expect(page.getByText(userB.user.username).first()).toBeVisible();

    // Click invite
    await page.getByRole('button', { name: 'Invitar' }).first().click();
    await page.waitForTimeout(1000);
  });

  test('Accept friend request', async ({ page }) => {
    const userA = await registerUser();
    const userB = await registerUser();

    // A sends request to B via API
    await sendFriendRequest(userA.accessToken, userB.user.id);

    // Login as B
    await loginWithToken(page, userB.accessToken);
    await page.goto('/home/requests');
    await page.waitForURL('**/home/requests**');

    // Verify A's request
    await expect(page.getByText(userA.user.username).first()).toBeVisible();

    // Click accept button (aria-label="Aceptar")
    await page.getByLabel('Aceptar').first().click();
    await page.waitForTimeout(1000);
  });

  test('Reject friend request', async ({ page }) => {
    const userA = await registerUser();
    const userB = await registerUser();

    await sendFriendRequest(userA.accessToken, userB.user.id);

    await loginWithToken(page, userB.accessToken);
    await page.goto('/home/requests');
    await page.waitForURL('**/home/requests**');

    await expect(page.getByText(userA.user.username).first()).toBeVisible();

    // Click reject button (aria-label="Rechazar")
    await page.getByLabel('Rechazar').first().click();
    await page.waitForTimeout(1000);
  });

  test('View friends list shows accepted friend', async ({ page }) => {
    const userA = await registerUser();
    const userB = await registerUser();

    const friendship = await sendFriendRequest(userA.accessToken, userB.user.id);
    await acceptFriendRequest(userB.accessToken, friendship.id);

    await loginWithToken(page, userA.accessToken);
    await page.goto('/home');
    await page.waitForURL('**/home**');

    await page.getByText('Todos').first().click();
    await page.waitForTimeout(500);

    await expect(page.getByText(userB.user.username).first()).toBeVisible();
  });

  test('Empty friends list', async ({ page }) => {
    const user = await registerUser();
    await loginWithToken(page, user.accessToken);

    await page.goto('/home');
    await page.waitForURL('**/home**');
    await page.getByText('Todos').first().click();
    await page.waitForTimeout(500);
  });

  test('Search for non-existent user shows no results', async ({ page }) => {
    const user = await registerUser();
    await loginWithToken(page, user.accessToken);

    await page.goto('/home/add');
    await page.waitForURL('**/home/add**');

    await page.getByPlaceholder('Nombre de usuario').fill('nonexistent_user_xyz_99999');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForTimeout(1000);

    const inviteButton = page.getByRole('button', { name: 'Invitar' });
    await expect(inviteButton).toHaveCount(0);
  });

  test('Search for yourself shows own profile in results', async ({ page }) => {
    const user = await registerUser();
    await loginWithToken(page, user.accessToken);

    await page.goto('/home/add');
    await page.waitForURL('**/home/add**');

    await page.getByPlaceholder('Nombre de usuario').fill(user.user.username);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForTimeout(1000);

    // User appears in search results
    await expect(page.getByText(user.user.username).first()).toBeVisible();
  });
});
