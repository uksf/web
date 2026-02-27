import { test, expect } from '@playwright/test';

test.describe('SelectionList', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-selectionlist--default&viewMode=story');
        await page.waitForSelector('app-selection-list');
        await expect(page.locator('app-selection-list')).toHaveScreenshot('selection-list-default.png');
    });

    test('MultiSelected visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-selectionlist--multi-selected&viewMode=story');
        await page.waitForSelector('app-selection-list .selection-element');
        await expect(page.locator('app-selection-list')).toHaveScreenshot('selection-list-multi.png');
    });
});
