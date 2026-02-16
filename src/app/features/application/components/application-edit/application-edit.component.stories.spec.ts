import { test, expect } from '@playwright/test';

test.describe('ApplicationEdit', () => {
    test('Waiting visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-edit--waiting&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-edit-waiting.png');
    });

    test('Accepted visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-edit--accepted&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-edit-accepted.png');
    });

    test('Rejected visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-edit--rejected&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-edit-rejected.png');
    });

    test('Waiting has two-column layout', async ({ page }) => {
        await page.goto('/iframe.html?id=application-edit--waiting&viewMode=story');
        await page.waitForSelector('.application-container');
        const cards = page.locator('.application-container mat-card');
        const count = await cards.count();
        expect(count).toBe(2);
        // Cards should be side by side
        const box1 = await cards.nth(0).boundingBox();
        const box2 = await cards.nth(1).boundingBox();
        if (box1 && box2) {
            expect(Math.abs(box1.y - box2.y)).toBeLessThan(5);
        }
    });
});
