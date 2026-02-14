import { test, expect } from '@playwright/test';

test.describe('InstallWorkshopModModal', () => {
    test('Inputs span full container width', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-installworkshopmod--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        const inputs = page.locator('app-text-input');
        const count = await inputs.count();
        expect(count).toBe(2);
        for (let i = 0; i < count; i++) {
            const box = await inputs.nth(i).boundingBox();
            expect(box.width).toBeGreaterThanOrEqual(690);
        }
    });

    test('Install button is visible in viewport', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-installworkshopmod--default&viewMode=story');
        await page.waitForSelector('app-button');
        await expect(page.locator('app-button')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-installworkshopmod--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('install-workshop-mod-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-installworkshopmod--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('install-workshop-mod-filled.png');
    });
});
