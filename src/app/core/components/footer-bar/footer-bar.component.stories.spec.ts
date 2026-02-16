import { test, expect } from '@playwright/test';

test.describe('FooterBar', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-footerbar--default&viewMode=story');
        await page.waitForSelector('.flex-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('footer-bar-default.png');
    });

    test('Has 5 social links', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-footerbar--default&viewMode=story');
        await page.waitForSelector('.buttons-container', { state: 'attached' });
        const links = page.locator('.buttons-container a');
        expect(await links.count()).toBe(5);
    });

    test('Copyright is visible', async ({ page }) => {
        await page.goto('/iframe.html?id=layout-footerbar--default&viewMode=story');
        await page.waitForSelector('.copyright');
        await expect(page.locator('.copyright')).toContainText('UKSF');
    });
});
