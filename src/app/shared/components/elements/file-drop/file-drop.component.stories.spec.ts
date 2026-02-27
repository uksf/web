import { test, expect } from '@playwright/test';

test.describe('FileDrop', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-filedrop--default&viewMode=story');
        await page.waitForSelector('app-file-drop');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('file-drop-default.png');
    });

    test('Disabled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-filedrop--disabled&viewMode=story');
        await page.waitForSelector('app-file-drop');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('file-drop-disabled.png');
    });

    test('Custom content visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-filedrop--custom-content&viewMode=story');
        await page.waitForSelector('app-file-drop');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('file-drop-custom.png');
    });
});
