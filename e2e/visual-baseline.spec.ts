import { test, expect } from '@playwright/test';

/**
 * Visual Regression Baseline Tests
 *
 * These tests capture screenshots of key pages to establish baselines.
 * Run these before making structural changes to compare against after.
 *
 * Usage:
 *   npx playwright test visual-baseline --update-snapshots  # Create/update baselines
 *   npx playwright test visual-baseline                     # Compare against baselines
 */

test.describe('Visual Baseline - Public Pages', () => {
  test('home page', async ({ page }) => {
    await page.goto('/home');
    // Wait for content to load
    await page.waitForSelector('app-home-page');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      timeout: 30000,
      // Mask all dynamic content that changes frequently
      mask: [
        page.locator('.timezone-container'), // Time displays
        page.locator('.instagram-feed'), // Instagram images that rotate
        page.locator('.teamspeak-container'), // TeamSpeak online users
        page.locator('iframe'), // Discord widget with online members
      ],
    });
  });

  test('information page', async ({ page }) => {
    await page.goto('/information');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('information-page.png', {
      fullPage: true,
      timeout: 30000,
    });
  });

  test('about page', async ({ page }) => {
    await page.goto('/information/about');
    await page.waitForSelector('app-about-page');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('about-page.png', {
      fullPage: true,
      timeout: 30000,
    });
  });

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#email');
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      timeout: 30000,
    });
  });
});

test.describe('Visual Baseline - Member Pages', () => {
  test('profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForSelector('app-profile-page');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('profile-page.png', {
      fullPage: true,
      timeout: 30000,
    });
  });

  test('units orbat page', async ({ page }) => {
    await page.goto('/units/orbat');
    await page.waitForSelector('app-units-orbat');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('units-orbat-page.png', {
      fullPage: true,
      timeout: 30000,
    });
  });

  test('personnel roster page', async ({ page }) => {
    await page.goto('/personnel/roster');
    await page.waitForSelector('app-personnel-roster');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('personnel-roster-page.png', {
      fullPage: true,
      timeout: 30000,
    });
  });

  test('modpack guide page', async ({ page }) => {
    await page.goto('/modpack/guide');
    await page.waitForSelector('app-modpack-guide');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('modpack-guide-page.png', {
      fullPage: true,
      timeout: 30000,
    });
  });
});

test.describe('Visual Baseline - Feature Pages', () => {
  // Note: These may redirect based on permissions
  // The test account needs appropriate permissions to view these

  test('modpack releases page', async ({ page }) => {
    await page.goto('/modpack/releases');
    // Will redirect if user doesn't have MEMBER permission
    const url = page.url();
    if (url.includes('modpack/releases')) {
      await page.waitForSelector('app-modpack-releases');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('modpack-releases-page.png', {
        fullPage: true,
        timeout: 30000,
      });
    }
  });

  test('modpack workshop page', async ({ page }) => {
    await page.goto('/modpack/workshop');
    const url = page.url();
    if (url.includes('modpack/workshop')) {
      await page.waitForSelector('app-modpack-workshop');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('modpack-workshop-page.png', {
        fullPage: true,
        timeout: 30000,
      });
    }
  });
});
