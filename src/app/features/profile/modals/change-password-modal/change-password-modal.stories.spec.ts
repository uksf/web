import { test, expect } from '@playwright/test';

test.describe('ChangePasswordModal', () => {
    test('Password inputs are at least 300px wide', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changepassword--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        const inputs = page.locator('app-text-input');
        const count = await inputs.count();
        expect(count).toBe(2);
        for (let i = 0; i < count; i++) {
            const box = await inputs.nth(i).boundingBox();
            expect(box).not.toBeNull();
            expect(box.width).toBeGreaterThanOrEqual(295);
        }
    });

    test('Submit button is visible in viewport', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changepassword--default&viewMode=story');
        await page.waitForSelector('button.mat-mdc-raised-button');
        await expect(page.locator('button.mat-mdc-raised-button')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changepassword--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('change-password-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changepassword--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('change-password-filled.png');
    });
});
