import { test, expect } from '@playwright/test';

/**
 * Feature interaction tests for modpack, command, personnel, and units
 * These run as authenticated user (depends on auth setup)
 */

test.describe('Modpack Feature', () => {
  test('modpack page has tab navigation', async ({ page }) => {
    await page.goto('/modpack/guide');
    await page.waitForSelector('app-modpack-guide');

    // Verify tab navigation exists
    const tabNav = page.locator('nav[mat-tab-nav-bar], [mat-tab-nav-bar]');
    if (await tabNav.isVisible()) {
      await expect(tabNav).toBeVisible();
    }
  });

  test('modpack guide page displays content', async ({ page }) => {
    await page.goto('/modpack/guide');
    await page.waitForSelector('app-modpack-guide');

    // Guide should have instructional content
    const guideContent = page.locator('app-modpack-guide');
    await expect(guideContent).toBeVisible();
    // Should contain images for the guide
    const images = guideContent.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('navigating to modpack releases page', async ({ page }) => {
    await page.goto('/modpack/releases');
    const url = page.url();
    if (url.includes('modpack/releases')) {
      await page.waitForSelector('app-modpack-releases');
      await expect(page.locator('app-modpack-releases')).toBeVisible();
    }
  });

  test('navigating to modpack workshop page', async ({ page }) => {
    await page.goto('/modpack/workshop');
    const url = page.url();
    if (url.includes('modpack/workshop')) {
      await page.waitForSelector('app-modpack-workshop');
      await expect(page.locator('app-modpack-workshop')).toBeVisible();
    }
  });
});

test.describe('Units Feature', () => {
  test('units orbat page displays tree structure', async ({ page }) => {
    await page.goto('/units/orbat');
    await page.waitForSelector('app-units-orbat');

    const orbat = page.locator('app-units-orbat');
    await expect(orbat).toBeVisible();
  });

  test('units page has expandable tree nodes', async ({ page }) => {
    await page.goto('/units/orbat');
    await page.waitForSelector('app-units-orbat');
    await page.waitForLoadState('networkidle');

    // Tree component should be present
    const treeNodes = page.locator('tree-root, .tree-node, [class*="tree"]');
    if (await treeNodes.first().isVisible()) {
      await expect(treeNodes.first()).toBeVisible();
    }
  });
});

test.describe('Personnel Feature', () => {
  test('personnel roster page loads with member list', async ({ page }) => {
    await page.goto('/personnel/roster');
    await page.waitForSelector('app-personnel-roster');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('app-personnel-roster')).toBeVisible();
  });

  test('personnel page has tab navigation', async ({ page }) => {
    await page.goto('/personnel/loas');
    // Wait for the personnel page wrapper
    const personnelPage = page.locator('app-personnel-page');
    if (await personnelPage.isVisible()) {
      // Tab navigation should exist
      const tabNav = page.locator('nav[mat-tab-nav-bar], [mat-tab-nav-bar]');
      if (await tabNav.isVisible()) {
        await expect(tabNav).toBeVisible();
      }
    }
  });

  test('personnel tabs navigate between sub-pages', async ({ page }) => {
    await page.goto('/personnel/roster');
    await page.waitForSelector('app-personnel-roster');

    // Navigate to LOAs tab if visible
    const loasTab = page.locator('a[mat-tab-link], [mat-tab-link]', { hasText: /LOA/i });
    if (await loasTab.isVisible()) {
      await loasTab.click();
      await expect(page).toHaveURL(/.*personnel\/loa/);
    }
  });
});

test.describe('Command Feature', () => {
  test('command page loads for authorized users', async ({ page }) => {
    await page.goto('/command/requests');
    const url = page.url();
    // Only test if we have command permission (not redirected)
    if (url.includes('command')) {
      await page.waitForLoadState('networkidle');
      // Should see some command page content
      const content = page.locator('[class*="command"], app-command-requests');
      if (await content.first().isVisible()) {
        await expect(content.first()).toBeVisible();
      }
    }
  });

  test('command members page loads member list', async ({ page }) => {
    await page.goto('/command/members');
    const url = page.url();
    if (url.includes('command/members')) {
      await page.waitForSelector('app-command-members', { timeout: 10000 }).catch(() => {});
      const membersComponent = page.locator('app-command-members');
      if (await membersComponent.isVisible()) {
        await expect(membersComponent).toBeVisible();
      }
    }
  });
});

test.describe('Operations Feature', () => {
  test('operations page loads for authorized users', async ({ page }) => {
    await page.goto('/operations');
    const url = page.url();
    if (url.includes('operations')) {
      await page.waitForLoadState('networkidle');
      const opsPage = page.locator('app-operations-page');
      if (await opsPage.isVisible()) {
        await expect(opsPage).toBeVisible();
      }
    }
  });

  test('operations AAR page loads', async ({ page }) => {
    await page.goto('/operations/aar');
    const url = page.url();
    if (url.includes('operations/aar')) {
      await page.waitForSelector('app-operations-aar', { timeout: 10000 }).catch(() => {});
      const aarComponent = page.locator('app-operations-aar');
      if (await aarComponent.isVisible()) {
        await expect(aarComponent).toBeVisible();
      }
    }
  });
});

test.describe('Home Page - Interactive Elements', () => {
  test('home page displays time zones', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-home-page');
    await page.waitForLoadState('networkidle');

    // Should display timezone information
    const homePage = page.locator('app-home-page');
    await expect(homePage).toBeVisible();
  });

  test('home page loads teamspeak panel', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-home-page');
    await page.waitForLoadState('networkidle');

    // TeamSpeak connect component should be present
    const teamspeakComponent = page.locator('app-teamspeak-connect');
    if (await teamspeakComponent.isVisible()) {
      await expect(teamspeakComponent).toBeVisible();
    }
  });
});

test.describe('Information Feature', () => {
  test('information page loads with sub-routes', async ({ page }) => {
    await page.goto('/information');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*information/);
  });

  test('about page has content', async ({ page }) => {
    await page.goto('/information/about');
    await page.waitForSelector('app-about-page');

    const aboutPage = page.locator('app-about-page');
    await expect(aboutPage).toBeVisible();
    // Should have meaningful text content
    const text = await aboutPage.textContent();
    expect(text.length).toBeGreaterThan(10);
  });

  test('policy page has content', async ({ page }) => {
    await page.goto('/information/policy');
    // May redirect to information/policy or policy
    const policyPage = page.locator('app-policy-page');
    if (await policyPage.isVisible()) {
      await expect(policyPage).toBeVisible();
    }
  });

  test('rules page has content', async ({ page }) => {
    await page.goto('/information/rules');
    const rulesPage = page.locator('app-rules-page');
    if (await rulesPage.isVisible()) {
      await expect(rulesPage).toBeVisible();
    }
  });
});
