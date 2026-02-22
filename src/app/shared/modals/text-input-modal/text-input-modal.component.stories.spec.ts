import { test, expect } from '@playwright/test';

test.describe('TextInputModal', () => {
    test('Has title, message, textarea, cancel and confirm buttons', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-textinput--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('h2')).toContainText('Input');
        await expect(page.locator('mat-dialog-content span')).toContainText('Please provide a reason');
        await expect(page.locator('textarea')).toBeVisible();
        const buttons = page.locator('mat-dialog-actions button');
        await expect(buttons).toHaveCount(2);
    });

    test('Confirm button is disabled when textarea is empty', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-textinput--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        const confirmBtn = page.locator('button[color="primary"]');
        await expect(confirmBtn).toBeDisabled();
    });

    test('Confirm button is enabled when textarea has content', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-textinput--filled&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        const confirmBtn = page.locator('button[color="primary"]');
        await expect(confirmBtn).toBeEnabled();
    });

    test('Textarea has maxlength of 200', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-textinput--default&viewMode=story');
        await page.waitForSelector('textarea');
        const maxlength = await page.locator('textarea').getAttribute('maxlength');
        expect(maxlength).toBe('200');
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-textinput--default&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('text-input-modal-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-textinput--filled&viewMode=story');
        await page.waitForSelector('mat-dialog-actions');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('text-input-modal-filled.png');
    });
});
