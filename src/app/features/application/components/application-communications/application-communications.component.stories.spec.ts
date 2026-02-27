import { test, expect } from '@playwright/test';

test.describe('ApplicationCommunications', () => {
    test('Pending visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-communications--pending&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-communications-pending.png');
    });

    test('Steam visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-communications--steam&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-communications-steam.png');
    });

    test('Discord visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-communications--discord&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-communications-discord.png');
    });
});
