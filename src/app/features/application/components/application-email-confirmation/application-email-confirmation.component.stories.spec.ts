import { test, expect } from '@playwright/test';

test.describe('ApplicationEmailConfirmation', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-emailconfirmation--default&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-email-confirmation-default.png');
    });
});
