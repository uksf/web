import { test, expect } from '@playwright/test';

test.describe('CreateDocumentModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-createdocument--default&viewMode=story');
        await page.waitForSelector('app-create-document-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('create-document-default.png');
    });
});
