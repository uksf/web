import { test, expect } from '@playwright/test';

test.describe('CommentDisplay', () => {
    test('With comments visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=components-commentdisplay--with-comments&viewMode=story');
        await page.waitForSelector('app-comment-display');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('comment-display-with-comments.png');
    });

    test('Empty visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=components-commentdisplay--empty&viewMode=story');
        await page.waitForSelector('app-comment-display');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('comment-display-empty.png');
    });
});
