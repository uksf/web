import { test, expect } from '@playwright/test';

test.describe('ValidationReportModal', () => {
    test('Single message has title, content, and close button', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-validationreport--single-message&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('Validation Report');
        await expect(page.locator('.title-container')).toContainText('Missing Required Fields');
        await expect(page.locator('button[color="primary"]')).toContainText('Close');
    });

    test('Single message has no navigation buttons', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-validationreport--single-message&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('button[mat-mini-fab]')).toHaveCount(0);
    });

    test('Multiple messages has navigation buttons', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-validationreport--multiple-messages&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('button[mat-mini-fab]')).toHaveCount(2);
    });

    test('Single message visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-validationreport--single-message&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('validation-report-single.png');
    });

    test('Error message visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-validationreport--error-message&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('validation-report-error.png');
    });

    test('Multiple messages visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-validationreport--multiple-messages&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('validation-report-multiple.png');
    });
});
