import { test, expect } from '@playwright/test';

test.describe('Dropdown', () => {
    test('Default renders input field', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--default&viewMode=story');
        await page.waitForSelector('app-dropdown .form-field input');
        await expect(page.locator('app-dropdown .form-field input')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--default&viewMode=story');
        await page.waitForSelector('app-dropdown .form-field');
        await expect(page.locator('app-dropdown')).toHaveScreenshot('dropdown-default.png');
    });

    test('Click opens autocomplete panel', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--default&viewMode=story');
        await page.waitForSelector('app-dropdown .form-field input');
        await page.locator('app-dropdown .form-field input').click();
        await expect(page.locator('.mat-mdc-autocomplete-panel')).toBeVisible();
    });

    test('Required visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--required&viewMode=story');
        await page.waitForSelector('app-dropdown .form-field');
        await expect(page.locator('app-dropdown')).toHaveScreenshot('dropdown-required.png');
    });
});
