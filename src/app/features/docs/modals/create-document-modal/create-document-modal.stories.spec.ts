import { test, expect } from '@playwright/test';

test.describe('CreateDocumentModal', () => {
    test('Input fills container width', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-createdocument--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        const input = page.locator('app-text-input');
        const box = await input.boundingBox();
        expect(box).not.toBeNull();
        expect(box.width).toBeGreaterThanOrEqual(200);
    });

    test('Submit button is visible in viewport', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-createdocument--default&viewMode=story');
        await page.waitForSelector('app-button');
        await expect(page.locator('app-button')).toBeVisible();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-createdocument--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('create-document-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-createdocument--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('create-document-filled.png');
    });

    test('Edit mode visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-createdocument--edit-mode&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('create-document-edit.png');
    });
});
