import { test, expect } from '@playwright/test';

test.describe('InlineEdit', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-inlineedit--default&viewMode=story');
        await page.waitForSelector('app-inline-edit .bold');
        await expect(page.locator('app-inline-edit')).toHaveScreenshot('inline-edit-default.png');
    });
});
