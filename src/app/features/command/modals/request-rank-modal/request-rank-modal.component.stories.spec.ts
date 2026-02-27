import { test, expect } from '@playwright/test';

test.describe('RequestRankModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestrank--default&viewMode=story');
        await page.waitForSelector('app-request-rank-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-rank-default.png');
    });
});
