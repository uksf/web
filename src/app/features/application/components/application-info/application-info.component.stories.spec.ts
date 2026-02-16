import { test, expect } from '@playwright/test';

test.describe('ApplicationInfo', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-info--default&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-info-default.png');
    });

    test('Next button is visible', async ({ page }) => {
        await page.goto('/iframe.html?id=application-info--default&viewMode=story');
        await page.waitForSelector('app-button');
        await expect(page.locator('app-button')).toBeVisible();
    });

    test('Card contains all section headings', async ({ page }) => {
        await page.goto('/iframe.html?id=application-info--default&viewMode=story');
        await page.waitForSelector('mat-card');
        const headings = page.locator('h4');
        const count = await headings.count();
        expect(count).toBe(9);
    });
});
