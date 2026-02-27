import { test, expect } from '@playwright/test';

test.describe('RequestLoaModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-loa-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--filled&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-loa-filled.png');
    });

    test('Late emergency visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--late-emergency&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-loa-emergency.png');
    });
});
