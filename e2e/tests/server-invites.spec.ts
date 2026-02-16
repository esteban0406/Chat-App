import { test, expect, loginWithToken } from '../helpers/fixtures';
import { registerUser } from '../helpers/auth';
import {
  createServer,
  sendFriendRequest,
  acceptFriendRequest,
  sendServerInvite,
} from '../helpers/api';
import { resetDB } from '../helpers/db';

test.describe.serial('Server invites', () => {
  test.beforeAll(async () => {
    await resetDB();
  });

  test('Invite friend to server via UI', async ({ page }) => {
    const ownerSession = await registerUser();
    const friendSession = await registerUser();

    // Make them friends
    const friendship = await sendFriendRequest(
      ownerSession.accessToken,
      friendSession.user.id,
    );
    await acceptFriendRequest(friendSession.accessToken, friendship.id);

    // Create server
    const server = await createServer(ownerSession.accessToken, 'Invite Server');

    // Login as owner
    await loginWithToken(page, ownerSession.accessToken);
    await page.goto(`/servers/${server.id}`);
    await page.waitForTimeout(1000);

    // Open server dropdown via chevron button and click "Invitar amigos"
    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);
    await page.getByText('Invitar amigos').click();

    // Should see friend listed
    await expect(
      page.getByText(friendSession.user.username).first(),
    ).toBeVisible();

    // Click invite button
    await page.getByRole('button', { name: 'Invitar' }).first().click();
    await page.waitForTimeout(1000);
  });

  test('Accept server invite', async ({ page }) => {
    const owner = await registerUser();
    const friend = await registerUser();

    const friendship = await sendFriendRequest(owner.accessToken, friend.user.id);
    await acceptFriendRequest(friend.accessToken, friendship.id);

    const server = await createServer(owner.accessToken, 'Accept Server');
    const invite = await sendServerInvite(
      owner.accessToken,
      server.id,
      friend.user.id,
    );

    // Login as friend
    await loginWithToken(page, friend.accessToken);
    await page.goto('/home/server-requests');
    await page.waitForURL('**/home/server-requests**');

    // Verify invite visible
    await expect(page.getByText('Accept Server').first()).toBeVisible();

    // Click accept (aria-label="Aceptar")
    await page.getByLabel('Aceptar').first().click();

    await page.waitForTimeout(2000);
  });

  test('Reject server invite', async ({ page }) => {
    const owner = await registerUser();
    const friend = await registerUser();

    const friendship = await sendFriendRequest(owner.accessToken, friend.user.id);
    await acceptFriendRequest(friend.accessToken, friendship.id);

    const server = await createServer(owner.accessToken, 'Reject Server');
    await sendServerInvite(owner.accessToken, server.id, friend.user.id);

    await loginWithToken(page, friend.accessToken);
    await page.goto('/home/server-requests');
    await page.waitForURL('**/home/server-requests**');

    await expect(page.getByText('Reject Server').first()).toBeVisible();

    // Click reject (aria-label="Rechazar")
    await page.getByLabel('Rechazar').first().click();

    await page.waitForTimeout(1000);
  });

  test('View pending server invites', async ({ page }) => {
    const owner = await registerUser();
    const friend = await registerUser();

    const friendship = await sendFriendRequest(owner.accessToken, friend.user.id);
    await acceptFriendRequest(friend.accessToken, friendship.id);

    const server = await createServer(owner.accessToken, 'Pending Server');
    await sendServerInvite(owner.accessToken, server.id, friend.user.id);

    await loginWithToken(page, friend.accessToken);
    await page.goto('/home/server-requests');
    await page.waitForURL('**/home/server-requests**');

    await expect(page.getByText('Pending Server').first()).toBeVisible();
  });

  test('Empty server invites shows empty state', async ({ page }) => {
    const user = await registerUser();
    await loginWithToken(page, user.accessToken);

    await page.goto('/home/server-requests');
    await page.waitForURL('**/home/server-requests**');

    await page.waitForTimeout(1000);
    // Either "No tienes invitaciones pendientes." or no invite rows
    const emptyMsg = page.getByText(/no tienes invitaciones/i);
    const hasEmpty = (await emptyMsg.count()) > 0;

    if (!hasEmpty) {
      // No invite items means empty
      const inviteItems = page.locator('[class*="invite"]');
      expect(await inviteItems.count()).toBe(0);
    }
  });
});
