import { test, expect } from '@playwright/test';

test.describe('AddUnitModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addunit--default&viewMode=story');
        await page.waitForSelector('app-add-unit-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-unit-default.png');
    });

    test('Edit mode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addunit--edit-mode&viewMode=story');
        await page.waitForSelector('app-add-unit-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-unit-edit.png');
    });
});
