import { test, expect } from '@playwright/test';

test.describe('ApplicationEdit', () => {
    test('Waiting visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-edit--waiting&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-edit-waiting.png');
    });
});
