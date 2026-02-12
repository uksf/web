import { test, expect } from '@playwright/test';

test.describe('SelectionList', () => {
    test('Default renders search input', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-selectionlist--default&viewMode=story');
        await page.waitForSelector('app-selection-list input[matinput]');
        await expect(page.locator('app-selection-list input[matinput]')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-selectionlist--default&viewMode=story');
        await page.waitForSelector('app-selection-list');
        await expect(page.locator('app-selection-list')).toHaveScreenshot('selection-list-default.png');
    });

    test('MultiSelected shows selected items', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-selectionlist--multi-selected&viewMode=story');
        await page.waitForSelector('app-selection-list .selection-element');
        const items = page.locator('app-selection-list .selection-element');
        await expect(items).toHaveCount(2);
    });

    test('MultiSelected visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-selectionlist--multi-selected&viewMode=story');
        await page.waitForSelector('app-selection-list .selection-element');
        await expect(page.locator('app-selection-list')).toHaveScreenshot('selection-list-multi.png');
    });
});
