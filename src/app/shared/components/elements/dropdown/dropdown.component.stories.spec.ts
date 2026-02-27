import { test, expect } from '@playwright/test';

test.describe('Dropdown', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--default&viewMode=story');
        await page.waitForSelector('app-dropdown .form-field');
        await expect(page.locator('app-dropdown')).toHaveScreenshot('dropdown-default.png');
    });

    test('Required visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dropdown--required&viewMode=story');
        await page.waitForSelector('app-dropdown .form-field');
        await expect(page.locator('app-dropdown')).toHaveScreenshot('dropdown-required.png');
    });
});
