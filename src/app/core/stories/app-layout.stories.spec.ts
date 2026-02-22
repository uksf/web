import { test, expect } from '@playwright/test';

const viewports = [
    { name: '375px', width: 375, height: 667 },
    { name: '600px', width: 600, height: 800 },
    { name: '768px', width: 768, height: 1024 },
    { name: '1024px', width: 1024, height: 768 },
    { name: '1360px', width: 1360, height: 900 },
    { name: '1920px', width: 1920, height: 1080 }
];

const stories = [
    { id: 'layout-applayout--not-logged-in', label: 'not-logged-in' },
    { id: 'layout-applayout--member', label: 'member' },
    { id: 'layout-applayout--admin', label: 'admin' }
];

test.describe('AppLayout responsive screenshots', () => {
    for (const story of stories) {
        for (const vp of viewports) {
            test(`${story.label} at ${vp.name}`, async ({ page }) => {
                await page.setViewportSize({ width: vp.width, height: vp.height });
                await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
                await page.waitForSelector('.wrapper');
                // Wait for layout to settle after viewport change
                await page.waitForTimeout(300);
                await expect(page.locator('#wrapper-parent')).toHaveScreenshot(
                    `app-layout-${story.label}-${vp.name}.png`
                );
            });
        }
    }
});
