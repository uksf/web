import { test, expect } from '@playwright/test';

test.describe('RequestRoleModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestrole--default&viewMode=story');
        await page.waitForSelector('app-request-role-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('request-role-default.png');
    });
});
