import { test, expect } from '@playwright/test';

test.describe('AddRankModal', () => {
    test('Inputs are 400px wide', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addrank--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        const inputs = page.locator('app-text-input');
        const count = await inputs.count();
        expect(count).toBe(4);
        for (let i = 0; i < count; i++) {
            const box = await inputs.nth(i).boundingBox();
            expect(box).not.toBeNull();
            expect(box.width).toBeGreaterThanOrEqual(395);
            expect(box.width).toBeLessThanOrEqual(405);
        }
    });

    test('Submit button is visible in viewport', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addrank--default&viewMode=story');
        await page.waitForSelector('app-button');
        await expect(page.locator('app-button')).toBeVisible();
        const box = await page.locator('app-button').boundingBox();
        expect(box).not.toBeNull();
        const viewport = page.viewportSize();
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addrank--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-rank-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addrank--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-rank-filled.png');
    });
});
