import { test, expect } from '@playwright/test';

test.describe('ApplicationDetails', () => {
    test('Empty visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-details--empty&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-details-empty.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-details--filled&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-details-filled.png');
    });

    test('Textareas have max-width of 750px', async ({ page }) => {
        await page.goto('/iframe.html?id=application-details--empty&viewMode=story');
        await page.waitForSelector('.large-input');
        const inputs = page.locator('.large-input');
        const count = await inputs.count();
        expect(count).toBe(3);
        for (let i = 0; i < count; i++) {
            const box = await inputs.nth(i).boundingBox();
            if (box) {
                expect(box.width).toBeLessThanOrEqual(755);
            }
        }
    });

    test('Role preference checkboxes are visible', async ({ page }) => {
        await page.goto('/iframe.html?id=application-details--empty&viewMode=story');
        await page.waitForSelector('mat-checkbox');
        const checkboxes = page.locator('mat-checkbox');
        const count = await checkboxes.count();
        // 1 military + 4 role preferences = 5
        expect(count).toBe(5);
    });
});
