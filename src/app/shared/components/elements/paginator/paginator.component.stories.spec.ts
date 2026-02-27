import { test, expect } from '@playwright/test';

test.describe('Paginator', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--default&viewMode=story');
        await page.waitForSelector('.paginator-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('paginator-default.png');
    });

    test('Small dataset visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--small-dataset&viewMode=story');
        await page.waitForSelector('.paginator-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('paginator-small.png');
    });

    test('Large dataset visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--large-dataset&viewMode=story');
        await page.waitForSelector('.paginator-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('paginator-large.png');
    });
});
