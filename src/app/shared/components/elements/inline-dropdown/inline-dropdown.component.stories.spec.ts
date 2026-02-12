import { test, expect } from '@playwright/test';

test.describe('InlineDropdown', () => {
    test('Default shows label and value', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-inlinedropdown--default&viewMode=story');
        await page.waitForSelector('app-inline-dropdown');
        await expect(page.locator('.bold')).toHaveText('Rank');
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-inlinedropdown--default&viewMode=story');
        await page.waitForSelector('app-inline-dropdown');
        await expect(page.locator('app-inline-dropdown')).toHaveScreenshot('inline-dropdown-default.png');
    });
});
