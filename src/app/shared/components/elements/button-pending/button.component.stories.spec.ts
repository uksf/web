import { test, expect } from '@playwright/test';

test.describe('ButtonPending', () => {
    test('Default renders at 36px height', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--default&viewMode=story');
        await page.waitForSelector('app-button button');
        const button = page.locator('app-button button');
        const box = await button.boundingBox();
        expect(box.height).toBe(36);
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--default&viewMode=story');
        await page.waitForSelector('app-button button');
        await expect(page.locator('app-button')).toHaveScreenshot('button-default.png');
    });

    test('Pending shows spinner and disables button', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--pending&viewMode=story');
        await page.waitForSelector('app-button button');
        const button = page.locator('app-button button');
        await expect(button).toBeDisabled();
        await expect(page.locator('mat-spinner')).toBeVisible();
    });

    test('Pending visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--pending&viewMode=story');
        await page.waitForSelector('app-button mat-spinner');
        await expect(page.locator('app-button')).toHaveScreenshot('button-pending.png');
    });

    test('Disabled renders disabled button', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--disabled&viewMode=story');
        await page.waitForSelector('app-button button');
        const button = page.locator('app-button button');
        await expect(button).toBeDisabled();
    });

    test('Disabled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-buttonpending--disabled&viewMode=story');
        await page.waitForSelector('app-button button');
        await expect(page.locator('app-button')).toHaveScreenshot('button-disabled.png');
    });
});
