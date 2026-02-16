import { test, expect } from '@playwright/test';

test.describe('LoginPage', () => {
    test('LoginMode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-loginpage--login-mode&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-page-login-mode.png');
    });

    test('RequestResetMode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-loginpage--request-reset-mode&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-page-request-reset-mode.png');
    });

    test('ResetMode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-loginpage--reset-mode&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('login-page-reset-mode.png');
    });

    test('Card is centered', async ({ page }) => {
        await page.goto('/iframe.html?id=auth-loginpage--login-mode&viewMode=story');
        await page.waitForSelector('mat-card');
        const wrapper = page.locator('.centre-wrapper');
        const card = page.locator('mat-card');
        const wrapperBox = await wrapper.boundingBox();
        const cardBox = await card.boundingBox();
        if (wrapperBox && cardBox) {
            const wrapperCenter = wrapperBox.x + wrapperBox.width / 2;
            const cardCenter = cardBox.x + cardBox.width / 2;
            expect(Math.abs(wrapperCenter - cardCenter)).toBeLessThan(20);
        }
    });
});
