import { test, expect } from '@playwright/test';

test.describe('Paginator', () => {
    test('Shows page range and navigation buttons', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--default&viewMode=story');
        await page.waitForSelector('.paginator-container');

        const text = await page.locator('.current-page').textContent();
        expect(text).toContain('1 - 15 of 100');

        const buttons = page.locator('.paginator-container button');
        await expect(buttons).toHaveCount(2);
    });

    test('Previous button is disabled on first page', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--default&viewMode=story');
        await page.waitForSelector('.paginator-container');

        const prevButton = page.locator('.paginator-container button').first();
        await expect(prevButton).toBeDisabled();
    });

    test('Next button is enabled when more pages exist', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--default&viewMode=story');
        await page.waitForSelector('.paginator-container');

        const nextButton = page.locator('.paginator-container button').last();
        await expect(nextButton).toBeEnabled();
    });

    test('Both buttons disabled for small dataset', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--small-dataset&viewMode=story');
        await page.waitForSelector('.paginator-container');

        const text = await page.locator('.current-page').textContent();
        expect(text).toContain('1 - 5 of 5');

        const prevButton = page.locator('.paginator-container button').first();
        const nextButton = page.locator('.paginator-container button').last();
        await expect(prevButton).toBeDisabled();
        await expect(nextButton).toBeDisabled();
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--default&viewMode=story');
        await page.waitForSelector('.paginator-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('paginator-default.png');
    });

    test('Small dataset visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--small-dataset&viewMode=story');
        await page.waitForSelector('.paginator-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('paginator-small.png');
    });

    test('Large dataset visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-paginator--large-dataset&viewMode=story');
        await page.waitForSelector('.paginator-container');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('paginator-large.png');
    });
});
