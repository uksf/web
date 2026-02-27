import { test, expect } from '@playwright/test';

test.describe('ChangeFirstLastModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changefirstlast--default&viewMode=story');
        await page.waitForSelector('app-change-first-last-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('change-first-last-default.png');
    });
});
