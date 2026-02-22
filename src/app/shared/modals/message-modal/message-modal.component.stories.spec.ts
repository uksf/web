import { test, expect } from '@playwright/test';

test.describe('MessageModal', () => {
    test('Has title, message, and close button', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-message--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('Message');
        await expect(page.locator('mat-dialog-content')).toContainText('submitted successfully');
        await expect(page.locator('button[color="primary"]')).toContainText('Close');
    });

    test('Only has one button (close)', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-message--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        const buttons = page.locator('mat-dialog-actions button');
        await expect(buttons).toHaveCount(1);
    });

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
