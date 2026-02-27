import { test, expect } from '@playwright/test';

test.describe('FooterBar', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-footerbar--default&viewMode=story');
        await page.waitForSelector('.flex-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('footer-bar-default.png');
    });
});
