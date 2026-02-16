import { test, expect } from '@playwright/test';

test.describe('ApplicationSubmit', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-submit--default&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-submit-default.png');
    });

    test('AllChecked visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-submit--all-checked&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-submit-all-checked.png');
    });

    test('Submit button is disabled when not all checked', async ({ page }) => {
        await page.goto('/iframe.html?id=application-submit--default&viewMode=story');
        await page.waitForSelector('app-button');
        const button = page.locator('app-button button');
        await expect(button).toBeDisabled();
    });

    test('Has 6 confirmation checkboxes', async ({ page }) => {
        await page.goto('/iframe.html?id=application-submit--default&viewMode=story');
        await page.waitForSelector('mat-checkbox');
        const checkboxes = page.locator('mat-checkbox');
        expect(await checkboxes.count()).toBe(6);
    });
});
