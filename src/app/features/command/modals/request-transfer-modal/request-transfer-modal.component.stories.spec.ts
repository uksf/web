import { test, expect } from '@playwright/test';

test.describe('RequestTransferModal', () => {
    test('Has title and form fields', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requesttransfer--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('Transfer Request');
        await expect(page.locator('app-selection-list')).toBeVisible();
        await expect(page.locator('app-dropdown')).toBeVisible();
        await expect(page.locator('app-text-input')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requesttransfer--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-transfer-default.png');
    });

    test('With selection visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requesttransfer--with-selection&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-transfer-with-selection.png');
    });
});
