import { test, expect } from '@playwright/test';

test.describe('ApplicationProgressBar', () => {
    test('Step1 visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-1-information&viewMode=story');
        await page.waitForSelector('app-application-page');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('progress-bar-step1.png');
    });
});
