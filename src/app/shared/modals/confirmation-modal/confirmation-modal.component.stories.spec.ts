import { test, expect } from '@playwright/test';

test.describe('ConfirmationModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-confirmation--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('confirmation-default.png');
    });

    test('Custom title visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-confirmation--custom-title&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('confirmation-custom-title.png');
    });

    test('HTML content visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-confirmation--html-content&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('confirmation-html-content.png');
    });
});
