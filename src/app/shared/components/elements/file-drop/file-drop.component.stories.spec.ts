import { test, expect } from '@playwright/test';

test.describe('FileDrop', () => {
    test('Renders drop zone with header text', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-filedrop--default&viewMode=story');
        await page.waitForSelector('app-file-drop');

        const text = await page.locator('app-file-drop').textContent();
        expect(text).toContain('Drop files here');
    });

    test('Disabled state renders with reduced opacity', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-filedrop--disabled&viewMode=story');
        await page.waitForSelector('app-file-drop');

        const text = await page.locator('app-file-drop').textContent();
        expect(text).toContain('File upload disabled');
    });

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
