import { test, expect } from '@playwright/test';

test.describe('LoginPage', () => {
    test('LoginMode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-loginpage--login-mode&viewMode=story');
        await page.waitForSelector('app-login-page');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-page-login-mode.png');
    });

    test('RequestResetMode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-loginpage--request-reset-mode&viewMode=story');
        await page.waitForSelector('app-login-page');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-page-request-reset-mode.png');
    });

    test('ResetMode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-loginpage--reset-mode&viewMode=story');
        await page.waitForSelector('app-login-page');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-page-reset-mode.png');
    });
});
