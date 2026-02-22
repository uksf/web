import { test, expect } from '@playwright/test';

test.describe('ConfirmationModal', () => {
    test('Has title, message, cancel and confirm buttons', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-confirmation--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('Confirm');
        await expect(page.locator('mat-dialog-content')).toContainText('Are you sure you want to proceed?');
        const buttons = page.locator('button[mat-raised-button]');
        await expect(buttons).toHaveCount(2);
        await expect(buttons.first()).toContainText('Cancel');
        await expect(buttons.last()).toContainText('Confirm');
    });

    test('Cancel button has warn color', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-confirmation--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        const cancelBtn = page.locator('button[color="warn"]');
        await expect(cancelBtn).toBeVisible();
    });

    test('Confirm button has primary color', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-confirmation--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        const confirmBtn = page.locator('button[color="primary"]');
        await expect(confirmBtn).toBeVisible();
    });

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
