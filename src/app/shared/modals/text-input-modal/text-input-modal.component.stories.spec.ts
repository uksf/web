import { test, expect } from '@playwright/test';

test.describe('TextInputModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-textinput--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('text-input-modal-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-textinput--filled&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('text-input-modal-filled.png');
    });
});
