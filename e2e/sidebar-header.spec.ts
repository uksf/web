import { test, expect } from '@playwright/test';

/**
 * Sidebar navigation and header bar interaction tests
 * These run as authenticated user (depends on auth setup)
 */

test.describe('Sidebar Navigation', () => {
  test('sidebar displays navigation items for authenticated member', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-side-bar');

    const sidebar = page.locator('app-side-bar');
    await expect(sidebar).toBeVisible();

    // Member should see core nav items
    await expect(sidebar.locator('.sideNavItem', { hasText: 'Home' })).toBeVisible();
    await expect(sidebar.locator('.sideNavItem', { hasText: 'Units' })).toBeVisible();
    await expect(sidebar.locator('.sideNavItem', { hasText: 'Modpack' })).toBeVisible();
    await expect(sidebar.locator('.sideNavItem', { hasText: 'Information' })).toBeVisible();
  });

  test('clicking sidebar items navigates to correct routes', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-side-bar');

    // Click Units
    await page.locator('app-side-bar .sideNavItem', { hasText: 'Units' }).click();
    await expect(page).toHaveURL(/.*units/);

    // Click Information
    await page.locator('app-side-bar .sideNavItem', { hasText: 'Information' }).click();
    await expect(page).toHaveURL(/.*information/);

    // Click Home to go back
    await page.locator('app-side-bar .sideNavItem', { hasText: 'Home' }).click();
    await expect(page).toHaveURL(/.*home/);
  });

  test('active sidebar item has selected styling', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-side-bar');

    // Home should be selected
    const homeItem = page.locator('app-side-bar .sideNavItem.selected', { hasText: 'Home' });
    await expect(homeItem).toBeVisible();
  });
});

test.describe('Header Bar', () => {
  test('header displays logo and site name', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-header-bar');

    await expect(page.locator('app-header-bar .logo')).toBeVisible();
    await expect(page.locator('app-header-bar', { hasText: 'United Kingdom Special Forces' })).toBeVisible();
  });

  test('header displays username for authenticated user', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-header-bar');

    const nameWrapper = page.locator('app-header-bar .name-wrapper');
    await expect(nameWrapper).toBeVisible();
    // Should contain some text (the user's name)
    await expect(nameWrapper).not.toBeEmpty();
  });

  test('clicking logo navigates to home', async ({ page }) => {
    await page.goto('/information/about');
    await page.waitForSelector('app-header-bar');

    await page.locator('app-header-bar .logo-wrapper').click();
    await expect(page).toHaveURL(/.*home/);
  });

  test('clicking username navigates to profile', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-header-bar');

    const nameWrapper = page.locator('app-header-bar .name-wrapper');
    if (await nameWrapper.isVisible()) {
      await nameWrapper.click();
      await expect(page).toHaveURL(/.*profile/);
    }
  });

  test('profile dropdown menu appears on click', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-header-bar');

    // Click the profile button to open dropdown
    const profileButton = page.locator('app-header-bar button.profile');
    if (await profileButton.isVisible()) {
      await profileButton.click();

      // Menu should appear with Profile and Logout options
      await expect(page.locator('button[mat-menu-item]', { hasText: 'Profile' })).toBeVisible();
      await expect(page.locator('button[mat-menu-item]', { hasText: 'Logout' })).toBeVisible();
    }
  });

  test('profile dropdown Profile link navigates to profile page', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-header-bar');

    const profileButton = page.locator('app-header-bar button.profile');
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.locator('button[mat-menu-item]', { hasText: 'Profile' }).click();
      await expect(page).toHaveURL(/.*profile/);
    }
  });

  test('notifications component is visible for authenticated user', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-header-bar');

    await expect(page.locator('app-notifications')).toBeVisible();
  });
});
