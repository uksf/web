import { test, expect, Page } from '@playwright/test';

/**
 * Visual Regression Baseline Tests
 *
 * Comprehensive screenshot tests for every major page and UI component state.
 * Catches regressions in layout, spacing, form fields, cards, modals, and more.
 *
 * Usage:
 *   npx playwright test visual-baseline --update-snapshots  # Create/update baselines
 *   npx playwright test visual-baseline                     # Compare against baselines
 */

// Helper: wait for page to be ready (content loaded + animations settled)
async function waitForPageReady(page: Page, selector: string) {
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  // Allow animations to settle
  await page.waitForTimeout(500);
}

// Helper: navigate to page, handling permission redirects
async function navigateIfPermitted(page: Page, path: string, selector: string): Promise<boolean> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const url = page.url();
  if (!url.includes(path.replace(/^\//, ''))) {
    return false;
  }
  await waitForPageReady(page, selector);
  return true;
}

// Shared screenshot options
const fullPageOpts = { fullPage: true, timeout: 30000 };

// ---------------------------------------------------------------------------
// 1. PUBLIC PAGES (unauthenticated-accessible)
// ---------------------------------------------------------------------------
test.describe('Visual - Public Pages', () => {
  test('login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#email');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('login-page.png', fullPageOpts);
  });

  test('information page', async ({ page }) => {
    await page.goto('/information');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('information-page.png', fullPageOpts);
  });

  test('about page', async ({ page }) => {
    await page.goto('/information/about');
    await waitForPageReady(page, 'app-about-page');
    await expect(page).toHaveScreenshot('about-page.png', fullPageOpts);
  });
});

// ---------------------------------------------------------------------------
// 2. CORE LAYOUT (header, sidebar, footer)
// ---------------------------------------------------------------------------
test.describe('Visual - Core Layout', () => {
  test('header bar', async ({ page }) => {
    await page.goto('/home');
    await waitForPageReady(page, 'app-header-bar');
    await expect(page.locator('app-header-bar')).toHaveScreenshot('header-bar.png', { timeout: 30000 });
  });

  test('sidebar navigation', async ({ page }) => {
    await page.goto('/home');
    await waitForPageReady(page, 'app-side-bar');
    await expect(page.locator('app-side-bar')).toHaveScreenshot('sidebar.png', { timeout: 30000 });
  });

  test('footer bar', async ({ page }) => {
    await page.goto('/home');
    await waitForPageReady(page, 'app-side-bar');
    // Footer is rendered inside the sidebar component
    const footer = page.locator('app-side-bar .footer');
    if (await footer.isVisible()) {
      await expect(footer).toHaveScreenshot('footer-bar.png', { timeout: 30000 });
    }
  });
});

// ---------------------------------------------------------------------------
// 3. MEMBER PAGES (full page screenshots)
// ---------------------------------------------------------------------------
test.describe('Visual - Member Pages', () => {
  test('home page', async ({ page }) => {
    await page.goto('/home');
    await waitForPageReady(page, 'app-home-page');
    await expect(page).toHaveScreenshot('home-page.png', {
      ...fullPageOpts,
      mask: [
        page.locator('.timezone-container'),
        page.locator('.instagram-feed'),
        page.locator('.teamspeak-container'),
        page.locator('iframe'),
      ],
    });
  });

  test('profile page', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageReady(page, 'app-profile-page');
    await expect(page).toHaveScreenshot('profile-page.png', fullPageOpts);
  });

  test('units orbat page', async ({ page }) => {
    await page.goto('/units/orbat');
    await waitForPageReady(page, 'app-units-orbat');
    await expect(page).toHaveScreenshot('units-orbat-page.png', fullPageOpts);
  });

  test('modpack guide page', async ({ page }) => {
    await page.goto('/modpack/guide');
    await waitForPageReady(page, 'app-modpack-guide');
    await expect(page).toHaveScreenshot('modpack-guide-page.png', fullPageOpts);
  });

  test('modpack releases page', async ({ page }) => {
    if (await navigateIfPermitted(page, '/modpack/releases', 'app-modpack-releases')) {
      await expect(page).toHaveScreenshot('modpack-releases-page.png', fullPageOpts);
    }
  });

  test('modpack workshop page', async ({ page }) => {
    if (await navigateIfPermitted(page, '/modpack/workshop', 'app-modpack-workshop')) {
      await expect(page).toHaveScreenshot('modpack-workshop-page.png', fullPageOpts);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. PERSONNEL PAGES (roster, LOAs, discharges)
// ---------------------------------------------------------------------------
test.describe('Visual - Personnel Pages', () => {
  test('personnel roster', async ({ page }) => {
    await page.goto('/personnel/roster');
    await waitForPageReady(page, 'app-personnel-roster');
    await expect(page).toHaveScreenshot('personnel-roster-page.png', fullPageOpts);
  });

  test('personnel LOAs', async ({ page }) => {
    await page.goto('/personnel/loas');
    await waitForPageReady(page, 'app-personnel-loas-list');
    await expect(page).toHaveScreenshot('personnel-loas-page.png', fullPageOpts);
  });

  test('personnel discharges', async ({ page }) => {
    await page.goto('/personnel/discharges');
    await waitForPageReady(page, 'app-personnel-discharges');
    await expect(page).toHaveScreenshot('personnel-discharges-page.png', fullPageOpts);
  });

  test('discharges - expanded card', async ({ page }) => {
    await page.goto('/personnel/discharges');
    await waitForPageReady(page, 'app-personnel-discharges');
    // Expand first discharge card
    const firstCard = page.locator('mat-expansion-panel').first();
    await firstCard.locator('mat-expansion-panel-header').click();
    await page.waitForTimeout(500);
    await expect(firstCard).toHaveScreenshot('discharge-card-expanded.png', { timeout: 30000 });
  });
});

// ---------------------------------------------------------------------------
// 5. OPERATIONS PAGES
// ---------------------------------------------------------------------------
test.describe('Visual - Operations Pages', () => {
  test('operations servers', async ({ page }) => {
    if (await navigateIfPermitted(page, '/operations/servers', 'app-operations-servers')) {
      // Wait for server list to load
      await page.waitForTimeout(3000);
      await expect(page).toHaveScreenshot('operations-servers-page.png', fullPageOpts);
    }
  });

  test('server card - buttons and dropdown alignment', async ({ page }) => {
    if (await navigateIfPermitted(page, '/operations/servers', 'app-operations-servers')) {
      await page.waitForTimeout(3000);
      const firstServer = page.locator('.servers-list-item').first();
      await expect(firstServer).toHaveScreenshot('server-card.png', { timeout: 30000 });
    }
  });

  test('operations AAR', async ({ page }) => {
    if (await navigateIfPermitted(page, '/operations/aar', 'app-operations-aar')) {
      await expect(page).toHaveScreenshot('operations-aar-page.png', fullPageOpts);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. COMMAND PAGES
// ---------------------------------------------------------------------------
test.describe('Visual - Command Pages', () => {
  test('command requests', async ({ page }) => {
    if (await navigateIfPermitted(page, '/command/requests', 'app-command-requests')) {
      await expect(page).toHaveScreenshot('command-requests-page.png', fullPageOpts);
    }
  });

  test('command members', async ({ page }) => {
    if (await navigateIfPermitted(page, '/command/members', 'app-command-members')) {
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot('command-members-page.png', fullPageOpts);
    }
  });

  test('command members - expanded card', async ({ page }) => {
    if (await navigateIfPermitted(page, '/command/members', 'app-command-members')) {
      await page.waitForTimeout(2000);
      const firstCard = page.locator('app-command-member-card').first();
      await firstCard.locator('.header-panel').click();
      await page.waitForTimeout(500);
      await expect(firstCard).toHaveScreenshot('member-card-expanded.png', { timeout: 30000 });
    }
  });

  test('command ranks', async ({ page }) => {
    if (await navigateIfPermitted(page, '/command/ranks', 'app-command-ranks')) {
      await expect(page).toHaveScreenshot('command-ranks-page.png', fullPageOpts);
    }
  });

  test('command roles', async ({ page }) => {
    if (await navigateIfPermitted(page, '/command/roles', 'app-command-roles')) {
      await expect(page).toHaveScreenshot('command-roles-page.png', fullPageOpts);
    }
  });

  test('command units', async ({ page }) => {
    if (await navigateIfPermitted(page, '/command/units', 'app-command-units')) {
      await expect(page).toHaveScreenshot('command-units-page.png', fullPageOpts);
    }
  });

  test('command training', async ({ page }) => {
    if (await navigateIfPermitted(page, '/command/training', 'app-command-training')) {
      await expect(page).toHaveScreenshot('command-training-page.png', fullPageOpts);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. RECRUITMENT PAGES
// ---------------------------------------------------------------------------
test.describe('Visual - Recruitment Pages', () => {
  test('recruitment page', async ({ page }) => {
    if (await navigateIfPermitted(page, '/recruitment', 'app-recruitment-page')) {
      await expect(page).toHaveScreenshot('recruitment-page.png', fullPageOpts);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. ADMIN PAGES
// ---------------------------------------------------------------------------
test.describe('Visual - Admin Pages', () => {
  test('admin variables', async ({ page }) => {
    if (await navigateIfPermitted(page, '/admin/variables', 'app-admin-variables')) {
      await expect(page).toHaveScreenshot('admin-variables-page.png', fullPageOpts);
    }
  });

  test('admin logs', async ({ page }) => {
    if (await navigateIfPermitted(page, '/admin/audit', 'app-admin-audit-logs')) {
      await page.waitForTimeout(2000);
      await expect(page).toHaveScreenshot('admin-logs-page.png', fullPageOpts);
    }
  });

  test('admin servers', async ({ page }) => {
    if (await navigateIfPermitted(page, '/admin/servers', 'app-admin-servers')) {
      await expect(page).toHaveScreenshot('admin-servers-page.png', fullPageOpts);
    }
  });

  test('admin tools', async ({ page }) => {
    if (await navigateIfPermitted(page, '/admin/tools', 'app-admin-tools')) {
      await expect(page).toHaveScreenshot('admin-tools-page.png', fullPageOpts);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. FORM FIELD STYLING (critical regression target)
// ---------------------------------------------------------------------------
test.describe('Visual - Form Fields', () => {
  test('login form - empty fields (label as placeholder)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#email');
    await page.waitForTimeout(500);
    const form = page.locator('form').first();
    await expect(form).toHaveScreenshot('form-login-empty.png', { timeout: 30000 });
  });

  test('login form - filled fields (floating labels)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#email');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword');
    // Click outside to unfocus
    await page.locator('h2').click();
    await page.waitForTimeout(300);
    const form = page.locator('form').first();
    await expect(form).toHaveScreenshot('form-login-filled.png', { timeout: 30000 });
  });

  test('login form - focused field', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('#email');
    await page.click('#email');
    await page.waitForTimeout(300);
    const emailField = page.locator('mat-form-field').first();
    await expect(emailField).toHaveScreenshot('form-field-focused.png', { timeout: 30000 });
  });

  test('filter field - standalone (no error space)', async ({ page }) => {
    await page.goto('/personnel/discharges');
    await waitForPageReady(page, 'app-personnel-discharges');
    const filterField = page.locator('mat-form-field').first();
    await expect(filterField).toHaveScreenshot('form-field-filter.png', { timeout: 30000 });
  });

  test('profile page - form fields', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageReady(page, 'app-profile-page');
    // Screenshot the settings card which contains form elements
    const settingsCard = page.locator('.settings mat-card').first();
    if (await settingsCard.isVisible()) {
      await expect(settingsCard).toHaveScreenshot('profile-settings-card.png', { timeout: 30000 });
    }
  });
});

// ---------------------------------------------------------------------------
// 10. MODAL DIALOGS
// ---------------------------------------------------------------------------
test.describe('Visual - Modals', () => {
  test('change name modal', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageReady(page, 'app-profile-page');
    await page.locator('button', { hasText: 'Change name' }).click();
    await page.waitForSelector('mat-dialog-container');
    await page.waitForTimeout(500);
    await expect(page.locator('mat-dialog-container')).toHaveScreenshot('modal-change-name.png', { timeout: 30000 });
    await page.keyboard.press('Escape');
  });

  test('change password modal', async ({ page }) => {
    await page.goto('/profile');
    await waitForPageReady(page, 'app-profile-page');
    await page.locator('button', { hasText: 'Change password' }).click();
    await page.waitForSelector('mat-dialog-container');
    await page.waitForTimeout(500);
    await expect(page.locator('mat-dialog-container')).toHaveScreenshot('modal-change-password.png', { timeout: 30000 });
    await page.keyboard.press('Escape');
  });

  test('request LOA modal', async ({ page }) => {
    await page.goto('/personnel/loas');
    await waitForPageReady(page, 'app-personnel-loas-list');
    const requestBtn = page.locator('button', { hasText: /Request LOA/i });
    if (await requestBtn.isVisible()) {
      await requestBtn.click();
      await page.waitForSelector('mat-dialog-container');
      await page.waitForTimeout(500);
      await expect(page.locator('mat-dialog-container')).toHaveScreenshot('modal-request-loa.png', { timeout: 30000 });
      await page.keyboard.press('Escape');
    }
  });
});

// ---------------------------------------------------------------------------
// 11. CARD COMPONENTS (spotlight hover, expansion panels)
// ---------------------------------------------------------------------------
test.describe('Visual - Card Components', () => {
  test('discharge cards - collapsed', async ({ page }) => {
    await page.goto('/personnel/discharges');
    await waitForPageReady(page, 'app-personnel-discharges');
    const cards = page.locator('mat-expansion-panel');
    // Screenshot first 3 cards
    for (let i = 0; i < 3; i++) {
      const card = cards.nth(i);
      if (await card.isVisible()) {
        await expect(card).toHaveScreenshot(`discharge-card-${i}.png`, { timeout: 30000 });
      }
    }
  });

  test('LOA cards', async ({ page }) => {
    await page.goto('/personnel/loas');
    await waitForPageReady(page, 'app-personnel-loas-list');
    const cards = page.locator('.list-container mat-card');
    if (await cards.first().isVisible()) {
      await expect(cards.first()).toHaveScreenshot('loa-card.png', { timeout: 30000 });
    }
  });

  test('member cards - collapsed', async ({ page }) => {
    if (await navigateIfPermitted(page, '/command/members', 'app-command-members')) {
      await page.waitForTimeout(2000);
      const firstCard = page.locator('app-command-member-card').first();
      if (await firstCard.isVisible()) {
        await expect(firstCard).toHaveScreenshot('member-card-collapsed.png', { timeout: 30000 });
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 12. DOCS PAGES
// ---------------------------------------------------------------------------
test.describe('Visual - Docs Pages', () => {
  test('docs page', async ({ page }) => {
    if (await navigateIfPermitted(page, '/docs', 'app-docs-page')) {
      await expect(page).toHaveScreenshot('docs-page.png', fullPageOpts);
    }
  });
});
