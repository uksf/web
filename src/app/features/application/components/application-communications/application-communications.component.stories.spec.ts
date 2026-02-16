import { test, expect } from '@playwright/test';

test.describe('ApplicationCommunications', () => {
    test('Pending visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-communications--pending&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-communications-pending.png');
    });

    test('SteamConnect visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-communications--steam-connect&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-communications-steam-connect.png');
    });

    test('DiscordConnect visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-communications--discord-connect&viewMode=story');
        await page.waitForSelector('mat-card');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('application-communications-discord-connect.png');
    });

    test('Spinner is centered in Pending', async ({ page }) => {
        await page.goto('/iframe.html?id=application-communications--pending&viewMode=story');
        await page.waitForSelector('mat-spinner');
        await expect(page.locator('mat-spinner')).toBeVisible();
    });
});
