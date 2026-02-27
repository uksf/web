import { test, expect } from '@playwright/test';

test.describe('AddRankModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addrank--default&viewMode=story');
        await page.waitForSelector('app-add-rank-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-rank-default.png');
    });
});
