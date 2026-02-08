import { test, expect } from '@playwright/test';

/**
 * Navigation tests for authenticated users
 * These tests verify that key routes load correctly when logged in
 */

test.describe('Navigation - Public Pages', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/.*home/);
    await expect(page.locator('app-home-page')).toBeVisible();
  });

  test('information page loads', async ({ page }) => {
    await page.goto('/information');
    await expect(page).toHaveURL(/.*information/);
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/information/about');
    await expect(page.locator('app-about-page')).toBeVisible();
  });

  test('policy page loads', async ({ page }) => {
    await page.goto('/policy');
    await expect(page.locator('app-policy-page')).toBeVisible();
  });

  test('rules page loads', async ({ page }) => {
    await page.goto('/rules');
    await expect(page.locator('app-rules-page')).toBeVisible();
  });
});

test.describe('Navigation - Member Pages', () => {
  test('profile page loads for authenticated user', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.locator('app-profile-page')).toBeVisible();
  });

  test('units orbat page loads', async ({ page }) => {
    await page.goto('/units/orbat');
    await expect(page.locator('app-units-orbat')).toBeVisible();
  });

  test('personnel roster loads', async ({ page }) => {
    await page.goto('/personnel/roster');
    await expect(page.locator('app-personnel-roster')).toBeVisible();
  });

  test('modpack guide page loads', async ({ page }) => {
    await page.goto('/modpack/guide');
    await expect(page.locator('app-modpack-guide')).toBeVisible();
  });
});
