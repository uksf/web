import { test, expect } from '@playwright/test';

test.describe('Admin backups page', () => {
    test('shows the selection, tree and run history', async ({ page }) => {
        await page.goto('/admin/backups');

        await expect(page.locator('app-admin-backups')).toBeVisible({ timeout: 30000 });
        await expect(page.getByRole('button', { name: 'Run backup now' })).toBeVisible();
        await expect(page.locator('app-backup-tree')).toBeVisible();
        await expect(page.getByText('Recent runs')).toBeVisible();

        await page.screenshot({ path: 'test-results/admin-backups.png', fullPage: true });
    });

    test('the tree lists drives and expands a folder', async ({ page }) => {
        await page.goto('/admin/backups');

        const tree = page.locator('app-backup-tree');
        await expect(tree.locator('.tree-row').first()).toBeVisible({ timeout: 30000 });

        const rowsBefore = await tree.locator('.tree-row').count();
        await tree.locator('.tree-row').first().locator('button.toggle').click();

        await expect.poll(async () => tree.locator('.tree-row').count()).toBeGreaterThan(rowsBefore);
    });
});
