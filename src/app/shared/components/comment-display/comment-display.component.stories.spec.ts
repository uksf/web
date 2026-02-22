import { test, expect } from '@playwright/test';

test.describe('CommentDisplay', () => {
    test('Shows comment form and comments', async ({ page }) => {
        await page.goto('/iframe.html?id=components-commentdisplay--with-comments&viewMode=story');
        await page.waitForSelector('.comments-container');
        await expect(page.locator('textarea')).toBeVisible();
        await expect(page.locator('.comment-wrapper')).toHaveCount(3);
    });

    test('Read-only mode hides comment form', async ({ page }) => {
        await page.goto('/iframe.html?id=components-commentdisplay--read-only&viewMode=story');
        await page.waitForSelector('.comments-container');
        await expect(page.locator('textarea')).toHaveCount(0);
        await expect(page.locator('.comment-wrapper')).toHaveCount(3);
    });

    test('Empty state shows form but no comments', async ({ page }) => {
        await page.goto('/iframe.html?id=components-commentdisplay--empty&viewMode=story');
        await page.waitForSelector('.comment-form');
        await expect(page.locator('textarea')).toBeVisible();
        await expect(page.locator('.comment-wrapper')).toHaveCount(0);
    });

    test('With comments visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=components-commentdisplay--with-comments&viewMode=story');
        await page.waitForSelector('.comments-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('comment-display-with-comments.png');
    });

    test('Read-only visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=components-commentdisplay--read-only&viewMode=story');
        await page.waitForSelector('.comments-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('comment-display-read-only.png');
    });

    test('Empty visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=components-commentdisplay--empty&viewMode=story');
        await page.waitForSelector('.comment-form');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('comment-display-empty.png');
    });
});
