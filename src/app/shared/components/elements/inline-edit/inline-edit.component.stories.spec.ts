import { test, expect } from '@playwright/test';

test.describe('InlineEdit', () => {
    test('Default shows label and value', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-inlineedit--default&viewMode=story');
        await page.waitForSelector('app-inline-edit .bold');
        await expect(page.locator('.bold')).toHaveText('Name');
        await expect(page.locator('.inline-edit')).toContainText('Sgt. Smith');
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-inlineedit--default&viewMode=story');
        await page.waitForSelector('app-inline-edit .bold');
        await expect(page.locator('app-inline-edit')).toHaveScreenshot('inline-edit-default.png');
    });

    test('Click to edit shows input', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-inlineedit--default&viewMode=story');
        await page.waitForSelector('.inline-edit');
        await page.locator('.inline-edit').click();
        await expect(page.locator('app-inline-edit input')).toBeVisible();
    });

    test('Disabled does not enter edit mode', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-inlineedit--disabled&viewMode=story');
        await page.waitForSelector('.inline-edit');
        await page.locator('.inline-edit').click();
        await expect(page.locator('app-inline-edit input')).not.toBeVisible();
    });

    test('Empty shows empty value', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-inlineedit--empty&viewMode=story');
        await page.waitForSelector('app-inline-edit');
        await expect(page.locator('.inline-edit')).toHaveText('');
    });
});
