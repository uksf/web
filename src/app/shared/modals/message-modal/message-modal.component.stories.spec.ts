import { test, expect } from '@playwright/test';

test.describe('MessageModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-message--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('message-default.png');
    });

    test('Custom title visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-message--custom-title&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('message-custom-title.png');
    });

    test('Long message visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-message--long-message&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('message-long.png');
    });
});
