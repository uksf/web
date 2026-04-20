import { test, expect } from '@playwright/test';

test.describe('RequestChainOfCommandPositionModal', () => {
    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-requestchainofcommandposition--default&viewMode=story');
        await page.waitForSelector('app-request-chain-of-command-position-modal');
        await expect(page.locator('.uksf-theme')).toHaveScreenshot('request-coc-position-default.png');
    });
});
