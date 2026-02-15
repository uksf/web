import { test, expect } from '@playwright/test';

test.describe('AddServerModal', () => {
    test('Text inputs are 400px wide', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addserver--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        const inputs = page.locator('app-text-input');
        const count = await inputs.count();
        expect(count).toBe(8);
        for (let i = 0; i < count; i++) {
            const box = await inputs.nth(i).boundingBox();
            expect(box).not.toBeNull();
            expect(box.width).toBeGreaterThanOrEqual(395);
            expect(box.width).toBeLessThanOrEqual(405);
        }
    });

    test('Submit button is visible in viewport', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addserver--filled&viewMode=story');
        await page.waitForSelector('button.mat-mdc-raised-button');
        await expect(page.locator('button.mat-mdc-raised-button')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addserver--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-server-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addserver--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-server-filled.png');
    });
});
