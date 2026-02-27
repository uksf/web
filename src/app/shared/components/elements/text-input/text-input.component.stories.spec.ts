import { test, expect } from '@playwright/test';

test.describe('TextInput', () => {
    test('Clearable visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--clearable&viewMode=story');
        await page.waitForSelector('app-text-input .form-field-clear');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-clearable.png');
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-default.png');
    });

    test('Filled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--filled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-filled.png');
    });

    test('Disabled visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--disabled&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-disabled.png');
    });

    test('Error state visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--error-state&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-error.png');
    });

    test('Textarea visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--textarea&viewMode=story');
        await page.waitForSelector('app-text-input textarea');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-textarea.png');
    });

    test('Inline with button visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--inline-with-button&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('text-input-inline-button.png');
    });

    test('Focused visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--default&viewMode=story');
        await page.waitForSelector('app-text-input input');
        await page.locator('app-text-input input').click();
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-focused.png');
    });

    test('Password visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--password&viewMode=story');
        await page.waitForSelector('app-text-input input');
        await page.locator('app-text-input input').click();
        await page.locator('app-text-input input').fill('secret123');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-password.png');
    });

    test('Email type visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--email-type&viewMode=story');
        await page.waitForSelector('app-text-input .form-field-error.visible');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-email-error.png');
    });

    test('Number type visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--number-type&viewMode=story');
        await page.waitForSelector('app-text-input input');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-number.png');
    });

    test('Full-width visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--full-width&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('form')).toHaveScreenshot('text-input-full-width.png');
    });

    test('Inline multiple inputs visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--inline-multiple-inputs-with-button&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('text-input-inline-multi.png');
    });

    test('Hint visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--with-hint&viewMode=story');
        await page.waitForSelector('app-text-input .form-field-hint');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-hint.png');
    });

    test('Required empty visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=shared-textinput--required-empty&viewMode=story');
        await page.waitForSelector('app-text-input input');
        // Touch to show error
        await page.locator('app-text-input input').click();
        await page.locator('body').click();
        await page.waitForSelector('app-text-input .form-field-error.visible');
        await expect(page.locator('app-text-input')).toHaveScreenshot('text-input-required-empty.png');
    });
});
