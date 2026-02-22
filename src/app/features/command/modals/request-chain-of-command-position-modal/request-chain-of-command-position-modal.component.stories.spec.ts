import { test, expect } from '@playwright/test';

test.describe('RequestChainOfCommandPositionModal', () => {
    test('Has title and form fields', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestchainofcommandposition--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('Chain of Command Position Request');
        await expect(page.locator('app-dropdown')).toHaveCount(3);
        await expect(page.locator('app-text-input')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestchainofcommandposition--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-coc-position-default.png');
    });

    test('With selection visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestchainofcommandposition--with-selection&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-coc-position-with-selection.png');
    });
});
