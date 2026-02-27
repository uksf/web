import { test, expect } from '@playwright/test';

test.describe('AddTrainingModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-addtraining--default&viewMode=story');
        await page.waitForSelector('app-add-training-modal');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('add-training-default.png');
    });
});
