import { test, expect } from '@playwright/test';

test.describe('AddServerModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addserver--default&viewMode=story');
        await page.waitForSelector('app-add-server-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-server-default.png');
    });
});
