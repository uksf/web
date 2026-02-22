import { test, expect } from '@playwright/test';

test.describe('RequestUnitRemovalModal', () => {
    test('Has title and form fields', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestunitremoval--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('Unit Removal Request');
        await expect(page.locator('app-dropdown')).toHaveCount(2);
        await expect(page.locator('app-text-input')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestunitremoval--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-unit-removal-default.png');
    });

    test('With selection visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestunitremoval--with-selection&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-unit-removal-with-selection.png');
    });
});
