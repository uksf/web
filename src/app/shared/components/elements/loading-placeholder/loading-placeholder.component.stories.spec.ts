import { test, expect } from '@playwright/test';

test.describe('LoadingPlaceholder', () => {
    test('Loading shows shimmer element', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-loadingplaceholder--loading&viewMode=story');
        await page.waitForSelector('.loading-shimmer');
        const shimmer = page.locator('.loading-shimmer');
        await expect(shimmer).toBeVisible();
        const box = await shimmer.boundingBox();
        expect(box.width).toBe(120);
        expect(box.height).toBe(16);
    });

    test('Loading visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-loadingplaceholder--loading&viewMode=story');
        await page.waitForSelector('.loading-shimmer');
        await expect(page.locator('app-loading-placeholder')).toHaveScreenshot('loading-shimmer.png');
    });

    test('Loaded shows content', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-loadingplaceholder--loaded&viewMode=story');
        await expect(page.locator('text=Loaded content')).toBeVisible();
    });

    test('Loaded visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-loadingplaceholder--loaded&viewMode=story');
        await page.waitForSelector('text=Loaded content');
        await expect(page.locator('app-loading-placeholder')).toHaveScreenshot('loading-loaded.png');
    });
});
