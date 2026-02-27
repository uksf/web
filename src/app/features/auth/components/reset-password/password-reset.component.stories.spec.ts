import { test, expect } from '@playwright/test';

test.describe('PasswordReset', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-passwordreset--default&viewMode=story');
        await page.waitForSelector('app-password-reset');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('password-reset-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-passwordreset--filled&viewMode=story');
        await page.waitForSelector('app-password-reset');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('password-reset-filled.png');
    });
});
