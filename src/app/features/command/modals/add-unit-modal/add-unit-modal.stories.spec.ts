import { test, expect } from '@playwright/test';

test.describe('AddUnitModal', () => {
    test('Text inputs are 400px wide', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addunit--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        const inputs = page.locator('app-text-input');
        const count = await inputs.count();
        expect(count).toBe(6);
        for (let i = 0; i < count; i++) {
            const box = await inputs.nth(i).boundingBox();
            expect(box).not.toBeNull();
            expect(box.width).toBeGreaterThanOrEqual(395);
            expect(box.width).toBeLessThanOrEqual(405);
        }
    });

    test('Submit button is reachable by scrolling', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addunit--filled&viewMode=story');
        await page.waitForSelector('app-button');
        await page.locator('app-button').scrollIntoViewIfNeeded();
        await expect(page.locator('app-button')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addunit--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-unit-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addunit--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-unit-filled.png');
    });

    test('Edit mode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addunit--edit-mode&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-unit-edit.png');
    });
});
