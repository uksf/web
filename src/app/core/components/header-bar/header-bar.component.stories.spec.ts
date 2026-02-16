import { test, expect } from '@playwright/test';

test.describe('HeaderBar', () => {
    test('LoggedIn visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-headerbar--logged-in&viewMode=story');
        await page.waitForSelector('.header-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('header-bar-logged-in.png');
    });

    test('Development visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-headerbar--development&viewMode=story');
        await page.waitForSelector('.header-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('header-bar-development.png');
    });

    test('NotLoggedIn visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-headerbar--not-logged-in&viewMode=story');
        await page.waitForSelector('.header-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('header-bar-not-logged-in.png');
    });

    test('Development has red border', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-headerbar--development&viewMode=story');
        await page.waitForSelector('.header-wrapper.development');
        await expect(page.locator('.header-wrapper.development')).toBeVisible();
    });
});
