import { test, expect } from '@playwright/test';

test.describe('ApplicationInfo', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-info--default&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-info-default.png');
    });
});
