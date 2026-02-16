import { test, expect } from '@playwright/test';

test.describe('SideBar', () => {
    test('NotLoggedIn visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-sidebar--not-logged-in&viewMode=story');
        await page.waitForSelector('.sideNav');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('side-bar-not-logged-in.png');
    });

    test('Member visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-sidebar--member&viewMode=story');
        await page.waitForSelector('.sideNav');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('side-bar-member.png');
    });

    test('Admin visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-sidebar--admin&viewMode=story');
        await page.waitForSelector('.sideNav');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('side-bar-admin.png');
    });

    test('NotLoggedIn has 1 item', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-sidebar--not-logged-in&viewMode=story');
        await page.waitForSelector('.sideNavItem');
        expect(await page.locator('.sideNavItem').count()).toBe(1);
    });

    test('Member has 7 items', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-sidebar--member&viewMode=story');
        await page.waitForSelector('.sideNavItem');
        expect(await page.locator('.sideNavItem').count()).toBe(7);
    });

    test('Admin has 8 items', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-sidebar--admin&viewMode=story');
        await page.waitForSelector('.sideNavItem');
        expect(await page.locator('.sideNavItem').count()).toBe(8);
    });
});
