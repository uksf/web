import { test, expect } from '@playwright/test';

test.describe('ChangeFirstLastModal', () => {
    test('Name inputs fill available width', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changefirstlast--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        const inputs = page.locator('app-text-input');
        const count = await inputs.count();
        expect(count).toBe(2);
        for (let i = 0; i < count; i++) {
            const box = await inputs.nth(i).boundingBox();
            expect(box).not.toBeNull();
            expect(box.width).toBeGreaterThanOrEqual(100);
        }
    });

    test('Name inputs are side by side', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changefirstlast--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        const inputs = page.locator('app-text-input');
        const firstBox = await inputs.nth(0).boundingBox();
        expect(firstBox).not.toBeNull();
        const secondBox = await inputs.nth(1).boundingBox();
        expect(secondBox).not.toBeNull();
        expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThanOrEqual(5);
        expect(secondBox.x).toBeGreaterThan(firstBox.x + firstBox.width - 10);
    });

    test('Submit button is visible in viewport', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changefirstlast--filled&viewMode=story');
        await page.waitForSelector('button.mat-mdc-raised-button');
        await expect(page.locator('button.mat-mdc-raised-button')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changefirstlast--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('change-first-last-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changefirstlast--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('change-first-last-filled.png');
    });
});
