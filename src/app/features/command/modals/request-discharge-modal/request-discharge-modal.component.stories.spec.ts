import { test, expect } from '@playwright/test';

test.describe('RequestDischargeModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestdischarge--default&viewMode=story');
        await page.waitForSelector('app-request-discharge-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-discharge-default.png');
    });
});
