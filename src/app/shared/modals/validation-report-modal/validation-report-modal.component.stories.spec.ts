import { test, expect } from '@playwright/test';

test.describe('ValidationReportModal', () => {
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
