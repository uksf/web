import { test, expect } from '@playwright/test';

test.describe('RequestUnitRemovalModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestunitremoval--default&viewMode=story');
        await page.waitForSelector('app-request-unit-removal-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-unit-removal-default.png');
    });
});
