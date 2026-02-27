import { test, expect } from '@playwright/test';

test.describe('RequestTransferModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requesttransfer--default&viewMode=story');
        await page.waitForSelector('app-request-transfer-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-transfer-default.png');
    });
});
