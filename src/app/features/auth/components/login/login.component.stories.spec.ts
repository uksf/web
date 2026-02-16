import { test, expect } from '@playwright/test';

test.describe('Login', () => {
    test('Empty visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-login--empty&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-empty.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-login--filled&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-filled.png');
    });

    test('Error visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-login--error&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-error.png');
    });

    test('Pending visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-login--pending&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-pending.png');
    });

    test('Card is max 500px wide', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-login--empty&viewMode=story');
        await page.waitForSelector('mat-card');
        const box = await page.locator('mat-card').boundingBox();
        if (box) {
            expect(box.width).toBeLessThanOrEqual(505);
        }
    });

    test('Error message is visible when login fails', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-login--error&viewMode=story');
        await page.waitForSelector('.invalid-message');
        await expect(page.locator('.invalid-message')).toContainText('Invalid email or password');
    });
});
