import { test, expect } from '@playwright/test';

test.describe('RequestPasswordReset', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-requestpasswordreset--default&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-password-reset-default.png');
    });

    test('Sent visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-requestpasswordreset--sent&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-password-reset-sent.png');
    });
});
