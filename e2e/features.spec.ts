import { test, expect } from '@playwright/test';

/**
 * Feature interaction tests for modpack, command, personnel, and units
 * These run as authenticated user (depends on auth setup)
 */

test.describe('Modpack Feature', () => {
  test('modpack guide page displays content with images', async ({ page }) => {
    await page.goto('/modpack/guide');
    await page.waitForSelector('app-modpack-guide');

    const guideContent = page.locator('app-modpack-guide');
    await expect(guideContent).toBeVisible();
    const images = guideContent.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('navigating to modpack releases page', async ({ page }) => {
    await page.goto('/modpack/releases');
    await page.waitForLoadState('networkidle');

    // Should either show releases page or redirect if no permission
    const url = page.url();
    if (url.includes('modpack/releases')) {
      await expect(page.locator('app-modpack-releases')).toBeVisible();
    }
  });

  test('navigating to modpack workshop page', async ({ page }) => {
    await page.goto('/modpack/workshop');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('modpack/workshop')) {
      await expect(page.locator('app-modpack-workshop')).toBeVisible();
    }
  });
});

test.describe('Units Feature', () => {
  test('units orbat page displays tree structure', async ({ page }) => {
    await page.goto('/units/orbat');
    await page.waitForSelector('app-units-orbat');

    await expect(page.locator('app-units-orbat')).toBeVisible();
  });

  test('units page has org chart nodes', async ({ page }) => {
    await page.goto('/units/orbat');
    await page.waitForSelector('app-units-orbat');
    await page.waitForLoadState('networkidle');

    // Org chart nodes should be present
    const orgNodes = page.locator('.node-header');
    await expect(orgNodes.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Personnel Feature', () => {
  test('personnel roster page loads', async ({ page }) => {
    await page.goto('/personnel/roster');
    await page.waitForSelector('app-personnel-roster');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-personnel-roster')).toBeVisible();
  });

  test('personnel page has tab navigation', async ({ page }) => {
    await page.goto('/personnel/loas');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-personnel-page')).toBeVisible();
  });

  test('personnel tabs navigate between sub-pages', async ({ page }) => {
    await page.goto('/personnel/roster');
    await page.waitForSelector('app-personnel-roster');

    // Navigate to LOAs tab
    const loasTab = page.locator('a[mat-tab-link], [mat-tab-link]', { hasText: /LOA/i });
    await expect(loasTab).toBeVisible();
    await loasTab.click();
    await expect(page).toHaveURL(/.*personnel\/loa/);
  });
});

test.describe('Command Feature', () => {
  test('command page loads or redirects', async ({ page }) => {
    await page.goto('/command/requests');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    // Only test if we have command permission (not redirected)
    if (url.includes('command')) {
      await expect(page.locator('app-command-requests')).toBeVisible();
    }
  });

  test('command members page loads or redirects', async ({ page }) => {
    await page.goto('/command/members');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('command/members')) {
      await expect(page.locator('app-command-members')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Operations Feature', () => {
  test('operations page loads or redirects', async ({ page }) => {
    await page.goto('/operations');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('operations')) {
      await expect(page.locator('app-operations-page')).toBeVisible();
    }
  });

  test('operations AAR page loads', async ({ page }) => {
    await page.goto('/operations/aar');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    if (url.includes('operations/aar')) {
      await expect(page.locator('app-operations-aar')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Home Page - Interactive Elements', () => {
  test('home page displays content', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-home-page');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-home-page')).toBeVisible();
  });
});

test.describe('Information Feature', () => {
  test('information page loads', async ({ page }) => {
    await page.goto('/information');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*information/);
  });

  test('about page has content', async ({ page }) => {
    await page.goto('/information/about');
    await page.waitForSelector('app-about-page');

    const aboutPage = page.locator('app-about-page');
    await expect(aboutPage).toBeVisible();
    const text = await aboutPage.textContent();
    expect(text.length).toBeGreaterThan(10);
  });

  test('policy page loads', async ({ page }) => {
    await page.goto('/information/policy');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-policy-page')).toBeVisible();
  });

  test('rules page loads', async ({ page }) => {
    await page.goto('/information/rules');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-rules-page')).toBeVisible();
  });
});
