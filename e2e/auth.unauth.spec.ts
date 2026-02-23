import { test, expect } from '@playwright/test';

/**
 * Authentication tests for unauthenticated users
 * These tests verify login flow and permission redirects work correctly
 *
 * Note: These run in the 'chromium-no-auth' project (no stored auth state)
 */

test.describe('Authentication - Login Flow', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible();
  });

  test('can access public pages without login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/.*home/);

    await page.goto('/information/about');
    await expect(page.locator('app-about-page')).toBeVisible();

    await page.goto('/policy');
    await expect(page.locator('app-policy-page')).toBeVisible();
  });
});

test.describe('Permission Redirects - Unauthenticated', () => {
  test('profile page redirects to login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*login/);
  });

  test('units orbat redirects to login', async ({ page }) => {
    await page.goto('/units/orbat');
    await expect(page).toHaveURL(/.*login/);
  });

  test('admin pages redirect to login', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page).toHaveURL(/.*login/);
  });

  test('modpack pages redirect to login', async ({ page }) => {
    await page.goto('/modpack/guide');
    await expect(page).toHaveURL(/.*login/);
  });

  test('personnel pages redirect to login', async ({ page }) => {
    await page.goto('/personnel/roster');
    await expect(page).toHaveURL(/.*login/);
  });

  test('command pages redirect to login', async ({ page }) => {
    await page.goto('/command/requests');
    await expect(page).toHaveURL(/.*login/);
  });
});
