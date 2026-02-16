import { test, expect } from '@playwright/test';

test.describe('ApplicationIdentity', () => {
    test('Empty visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-identity--empty&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-identity-empty.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-identity--filled&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-identity-filled.png');
    });

    test('PasswordMismatch visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-identity--password-mismatch&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-identity-password-mismatch.png');
    });

    test('Name fields are side by side', async ({ page }) => {
        await page.goto('/iframe.html?id=application-identity--filled&viewMode=story');
        await page.waitForSelector('.names-container');
        const names = page.locator('.names-container .name');
        const count = await names.count();
        expect(count).toBe(2);
        const box1 = await names.nth(0).boundingBox();
        const box2 = await names.nth(1).boundingBox();
        if (box1 && box2) {
            // They should be on the same row (similar y position)
            expect(Math.abs(box1.y - box2.y)).toBeLessThan(5);
        }
    });

    test('DOB fields are inline', async ({ page }) => {
        await page.goto('/iframe.html?id=application-identity--empty&viewMode=story');
        await page.waitForSelector('.dob');
        const dobFields = page.locator('.dob');
        const count = await dobFields.count();
        expect(count).toBe(3);
    });
});
