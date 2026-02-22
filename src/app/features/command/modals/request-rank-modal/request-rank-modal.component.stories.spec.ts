import { test, expect } from '@playwright/test';

test.describe('RequestRankModal', () => {
    test('Has title and form fields', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestrank--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('Promotion/Demotion Request');
        await expect(page.locator('app-selection-list')).toBeVisible();
        await expect(page.locator('app-dropdown')).toBeVisible();
        await expect(page.locator('app-text-input')).toBeVisible();
    });

    test('Submit button is disabled when form is empty', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestrank--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        const submitBtn = page.locator('mat-dialog-actions app-button button');
        await expect(submitBtn).toBeDisabled();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestrank--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-rank-default.png');
    });

    test('With selection visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestrank--with-selection&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-rank-with-selection.png');
    });
});
