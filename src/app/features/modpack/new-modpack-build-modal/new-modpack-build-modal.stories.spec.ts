import { test, expect } from '@playwright/test';

test.describe('NewModpackBuildModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-newmodpackbuild--default&viewMode=story');
        await page.waitForSelector('app-new-modpack-build-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('new-modpack-build-default.png');
    });
});
