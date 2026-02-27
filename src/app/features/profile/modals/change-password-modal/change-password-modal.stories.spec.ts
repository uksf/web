import { test, expect } from '@playwright/test';

test.describe('ChangePasswordModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-changepassword--default&viewMode=story');
        await page.waitForSelector('app-change-password-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('change-password-default.png');
    });
});
