import { test, expect } from '@playwright/test';

test.describe('ContentAreas', () => {
    test('Default layout has main and side areas', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-contentareas--default-layout&viewMode=story');
        await page.waitForSelector('app-default-content-areas');

        await expect(page.locator('app-main-content-area')).toBeVisible();
        await expect(page.locator('app-side-content-area')).toBeVisible();
    });

    test('Default layout visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-contentareas--default-layout&viewMode=story');
        await page.waitForSelector('app-default-content-areas');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('content-areas-default.png');
    });

    test('Full width layout visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-contentareas--with-full-content-area&viewMode=story');
        await page.waitForSelector('app-full-content-area');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('content-areas-full.png');
    });
});
