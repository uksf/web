import { test, expect } from '@playwright/test';

test.describe('ApplicationProgressBar', () => {
    test('Step1 visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-1-information&viewMode=story');
        await page.waitForSelector('.progress-container-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('progress-bar-step1.png');
    });

    test('Step2 visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-2-identity&viewMode=story');
        await page.waitForSelector('.progress-container-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('progress-bar-step2.png');
    });

    test('Step3 visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-3-email-confirmation&viewMode=story');
        await page.waitForSelector('.progress-container-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('progress-bar-step3.png');
    });

    test('Step4 visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-4-communications&viewMode=story');
        await page.waitForSelector('.progress-container-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('progress-bar-step4.png');
    });

    test('Step5 visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-5-details&viewMode=story');
        await page.waitForSelector('.progress-container-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('progress-bar-step5.png');
    });

    test('Step6 visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-6-submit&viewMode=story');
        await page.waitForSelector('.progress-container-wrapper');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('progress-bar-step6.png');
    });

    test('Progress bar has 6 boxes', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-1-information&viewMode=story');
        await page.waitForSelector('.box');
        const boxes = page.locator('.box');
        expect(await boxes.count()).toBe(6);
    });

    test('First step has exactly one enabled box', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-1-information&viewMode=story');
        await page.waitForSelector('.box');
        const enabled = page.locator('.box.enabled');
        expect(await enabled.count()).toBe(1);
        await expect(enabled).toContainText('Information');
    });

    test('Step 4 has 3 complete and 1 enabled box', async ({ page }) => {
        await page.goto('/iframe.html?id=application-progressbar--step-4-communications&viewMode=story');
        await page.waitForSelector('.box');
        const complete = page.locator('.box.complete');
        const enabled = page.locator('.box.enabled');
        expect(await complete.count()).toBe(3);
        expect(await enabled.count()).toBe(1);
        await expect(enabled).toContainText('Communications');
    });
});
