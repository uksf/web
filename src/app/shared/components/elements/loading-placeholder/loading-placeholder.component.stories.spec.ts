import { test, expect } from '@playwright/test';

test.describe('LoadingPlaceholder', () => {
    test('Loading visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-loadingplaceholder--loading&viewMode=story');
        await page.waitForSelector('.loading-shimmer');
        await expect(page.locator('app-loading-placeholder')).toHaveScreenshot('loading-shimmer.png');
    });

    test('Loaded visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-loadingplaceholder--loaded&viewMode=story');
        await page.waitForSelector('text=Loaded content');
        await expect(page.locator('app-loading-placeholder')).toHaveScreenshot('loading-loaded.png');
    });
});
