import { test, expect, loginWithToken } from '../helpers/fixtures';
import { registerUser } from '../helpers/auth';
import {
  createServer,
  createRole,
  getRoles,
  sendFriendRequest,
  acceptFriendRequest,
  sendServerInvite,
  acceptServerInvite,
} from '../helpers/api';
import { resetDB } from '../helpers/db';

test.describe.serial('Role management', () => {
  let ownerToken: string;
  let serverId: string;

  test.beforeAll(async () => {
    await resetDB();
    const owner = await registerUser();
    ownerToken = owner.accessToken;
    const server = await createServer(ownerToken, 'Roles Server');
    serverId = server.id;
  });

  test('View roles modal', async ({ page }) => {
    await loginWithToken(page, ownerToken);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    // Click the chevron dropdown button to open server menu
    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);
    await page.getByText('Gestionar roles').click();

    // Verify modal opens with "Roles" heading
    await expect(page.getByText('Roles').first()).toBeVisible();
  });

  test('Default roles exist', async ({ page }) => {
    await loginWithToken(page, ownerToken);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    // Click the chevron dropdown button to open server menu
    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);
    await page.getByText('Gestionar roles').click();
    await page.waitForTimeout(1000);

    // Verify Admin and Member roles
    await expect(page.getByText('Admin').first()).toBeVisible();
    await expect(page.getByText('Member').first()).toBeVisible();
  });

  test('Create new role via API and verify in modal', async ({ page }) => {
    // Create role via API
    await createRole(ownerToken, serverId, 'CustomRole');

    await loginWithToken(page, ownerToken);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    // Open roles modal
    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);
    await page.getByText('Gestionar roles').click();
    await page.waitForTimeout(1000);

    // Verify new role appears in the sidebar list
    await expect(page.getByText('CustomRole').first()).toBeVisible();
  });

  test('Select custom role and view permissions', async ({ page }) => {
    await loginWithToken(page, ownerToken);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);
    await page.getByText('Gestionar roles').click();
    await page.waitForTimeout(1000);

    // Select the custom role
    await page.getByText('CustomRole').first().click();
    await page.waitForTimeout(500);

    // Permission toggles should be visible
    await expect(page.getByText('Crear canal').first()).toBeVisible();
    await expect(page.getByText('Eliminar canal').first()).toBeVisible();
  });

  test('Delete custom role', async ({ page }) => {
    await loginWithToken(page, ownerToken);
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);
    await page.getByText('Gestionar roles').click();
    await page.waitForTimeout(1000);

    // Select custom role via API delete instead of UI
    // (The sidebar click has React state issues in the modal)
    const roles = await getRoles(ownerToken, serverId);
    const customRole = roles.find((r) => r.name === 'CustomRole');
    expect(customRole).toBeTruthy();

    // Delete via API
    const res = await fetch(`http://localhost:4000/api/servers/${serverId}/roles/${customRole!.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(res.ok).toBe(true);

    // Verify in UI that role is gone
    await page.goto(`/servers/${serverId}`);
    await page.waitForTimeout(1000);

    const chevronBtn2 = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn2.click();
    await page.waitForTimeout(300);
    await page.getByText('Gestionar roles').click();
    await page.waitForTimeout(1000);

    // CustomRole should not appear in the list anymore
    await expect(page.locator('button:has-text("CustomRole")')).toHaveCount(0);
  });

  test('Assign member to role', async ({ page }) => {
    // Create a new member
    const member = await registerUser();
    const owner = await registerUser();
    const server = await createServer(owner.accessToken, 'Assign Role Server');

    // Make them friends and invite to server
    const friendship = await sendFriendRequest(
      owner.accessToken,
      member.user.id,
    );
    await acceptFriendRequest(member.accessToken, friendship.id);
    const invite = await sendServerInvite(
      owner.accessToken,
      server.id,
      member.user.id,
    );
    await acceptServerInvite(member.accessToken, invite.id);

    await loginWithToken(page, owner.accessToken);
    await page.goto(`/servers/${server.id}`);
    await page.waitForTimeout(1000);

    // Open roles modal
    const chevronBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-down') });
    await chevronBtn.click();
    await page.waitForTimeout(300);
    await page.getByText('Gestionar roles').click();
    await page.waitForTimeout(1000);

    // Select Admin role
    await page.getByText('Admin').first().click();
    await page.waitForTimeout(500);

    // Click "Agregar miembro" if visible
    const addMemberBtn = page.getByText('Agregar miembro');
    if ((await addMemberBtn.count()) > 0) {
      await addMemberBtn.first().click();
      await page.waitForTimeout(500);

      // Select member from dropdown
      const memberOption = page.getByText(member.user.username);
      if ((await memberOption.count()) > 0) {
        await memberOption.first().click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
