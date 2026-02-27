import { test, expect } from '@playwright/test';

test.describe('InstallWorkshopModModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-installworkshopmod--default&viewMode=story');
        await page.waitForSelector('app-install-workshop-mod-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('install-workshop-mod-default.png');
    });
});
