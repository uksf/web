import { test, expect } from '@playwright/test';

test.describe('ButtonPending', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--default&viewMode=story');
        await page.waitForSelector('app-button button');
        await expect(page.locator('app-button')).toHaveScreenshot('button-default.png');
    });

    test('Pending visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--pending&viewMode=story');
        await page.waitForSelector('app-button mat-spinner');
        await expect(page.locator('app-button')).toHaveScreenshot('button-pending.png');
    });

    test('Disabled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--disabled&viewMode=story');
        await page.waitForSelector('app-button button');
        await expect(page.locator('app-button')).toHaveScreenshot('button-disabled.png');
    });
});
