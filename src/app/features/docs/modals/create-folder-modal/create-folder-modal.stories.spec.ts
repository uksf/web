import { test, expect } from '@playwright/test';

test.describe('CreateFolderModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-createfolder--default&viewMode=story');
        await page.waitForSelector('app-create-folder-modal');
        await expect(page.locator('.uksf-theme')).toHaveScreenshot('create-folder-default.png');
    });
});
