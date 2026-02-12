import { test, expect } from '@playwright/test';

test.describe('Dropdown', () => {
    test('Default renders input field', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--default&viewMode=story');
        await page.waitForSelector('app-dropdown input[matinput]');
        await expect(page.locator('app-dropdown input[matinput]')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--default&viewMode=story');
        await page.waitForSelector('app-dropdown');
        await expect(page.locator('app-dropdown')).toHaveScreenshot('dropdown-default.png');
    });

    test('Click opens autocomplete panel', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--default&viewMode=story');
        await page.waitForSelector('app-dropdown input[matinput]');
        await page.locator('app-dropdown input[matinput]').click();
        await expect(page.locator('.mat-mdc-autocomplete-panel')).toBeVisible();
    });

    test('Required visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--required&viewMode=story');
        await page.waitForSelector('app-dropdown');
        await expect(page.locator('app-dropdown')).toHaveScreenshot('dropdown-required.png');
    });
});
