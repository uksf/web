import { test, expect } from '@playwright/test';

test.describe('DateInput', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--default&viewMode=story');
        await page.waitForSelector('app-date-input .form-field');
        await expect(page.locator('app-date-input')).toHaveScreenshot('date-input-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--filled&viewMode=story');
        await page.waitForSelector('app-date-input .form-field');
        await expect(page.locator('app-date-input')).toHaveScreenshot('date-input-filled.png');
    });

    test('No label visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--no-label&viewMode=story');
        await page.waitForSelector('app-date-input .form-field');
        await expect(page.locator('app-date-input')).toHaveScreenshot('date-input-no-label.png');
    });

    test('No label filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--no-label-filled&viewMode=story');
        await page.waitForSelector('app-date-input .form-field');
        await expect(page.locator('app-date-input')).toHaveScreenshot('date-input-no-label-filled.png');
    });

    test('Disabled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--disabled&viewMode=story');
        await page.waitForSelector('app-date-input .form-field');
        await expect(page.locator('app-date-input')).toHaveScreenshot('date-input-disabled.png');
    });

    test('Required visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--required&viewMode=story');
        await page.waitForSelector('app-date-input .form-field');
        await expect(page.locator('app-date-input')).toHaveScreenshot('date-input-required.png');
    });

    test('Error state visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--error-state&viewMode=story');
        await page.waitForSelector('app-date-input .form-field-error.visible');
        await expect(page.locator('app-date-input')).toHaveScreenshot('date-input-error.png');
    });

    test('Focused visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--default&viewMode=story');
        await page.waitForSelector('app-date-input input');
        await page.locator('app-date-input input[type="text"]').click();
        await expect(page.locator('app-date-input')).toHaveScreenshot('date-input-focused.png');
    });

    test('Inline with other fields visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--inline-with-other-fields&viewMode=story');
        await page.waitForSelector('app-date-input .form-field');
        await expect(page.locator('form')).toHaveScreenshot('date-input-inline.png');
    });

    test('Error without reserved space visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-dateinput--error-without-reserved-space&viewMode=story');
        await page.waitForSelector('app-date-input .form-field-error.visible');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('date-input-error-no-space.png');
    });
});
