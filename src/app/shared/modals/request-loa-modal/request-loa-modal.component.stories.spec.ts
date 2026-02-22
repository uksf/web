import { test, expect } from '@playwright/test';

test.describe('RequestLoaModal', () => {
    test('Has title, reason field, date pickers, and submit button', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('LOA Request');
        await expect(page.locator('.gmt-note')).toContainText('Dates should be considered as GMT');
        await expect(page.locator('app-text-input')).toBeVisible();
        await expect(page.locator('mat-datepicker-toggle')).toHaveCount(2);
    });

    test('Submit button is disabled when form is empty', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        const submitBtn = page.locator('button[color="primary"]');
        await expect(submitBtn).toBeDisabled();
    });

    test('Submit button is enabled when form is filled', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--filled&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        const submitBtn = page.locator('button[color="primary"]');
        await expect(submitBtn).toBeEnabled();
    });

    test('Emergency checkbox visible in late scenario', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--late-emergency&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('mat-checkbox')).toBeVisible();
        await expect(page.locator('mat-checkbox')).toContainText('Emergency');
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-loa-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--filled&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-loa-filled.png');
    });

    test('Late emergency visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestloa--late-emergency&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-loa-emergency.png');
    });
});
