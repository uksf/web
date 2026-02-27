import { test, expect } from '@playwright/test';

test.describe('ApplicationDetails', () => {
    test('Empty visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-details--empty&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-details-empty.png');
    });
});
