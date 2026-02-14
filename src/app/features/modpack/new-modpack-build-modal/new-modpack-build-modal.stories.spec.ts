import { test, expect } from '@playwright/test';

test.describe('NewModpackBuildModal', () => {
    test('Inputs span full container width', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-newmodpackbuild--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        const input = page.locator('app-text-input');
        const box = await input.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(200);
    });

    test('Run button is visible in viewport', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-newmodpackbuild--default&viewMode=story');
        await page.waitForSelector('button.mat-mdc-raised-button');
        await expect(page.locator('button.mat-mdc-raised-button')).toBeVisible();
        const box = await page.locator('button.mat-mdc-raised-button').boundingBox();
        const viewport = page.viewportSize();
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    });

    test('Default visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-newmodpackbuild--default&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('new-modpack-build-default.png');
    });

    test('Branch selected visual regression', async ({ page }) => {
        await page.goto('/iframe.html?id=modals-newmodpackbuild--branch-selected&viewMode=story');
        await page.waitForSelector('app-text-input');
        await expect(page.locator('.dark-theme')).toHaveScreenshot('new-modpack-build-branch-selected.png');
    });
});
