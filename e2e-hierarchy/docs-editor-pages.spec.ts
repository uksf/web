import { test, expect } from '@playwright/test';
import { commandRoles, getLastWrite, installIsolation, memberRoles, resetLastWrite } from './hierarchy-harness';

const scratch = '/Users/tim/.agent-scratch/docs-editor-reuse';

test.describe.configure({ mode: 'serial' });

test.describe('docs-parity editor pages', () => {
    test('campaign/operation/intel editors are full pages with save and cancel', async ({ page }) => {
        await installIsolation(page, commandRoles);
        await page.goto('/operations/campaigns/new');
        await expect(page.locator('app-operations-campaign-editor')).toBeVisible();
        await expect(page.locator('app-docs-editor')).toBeVisible();
        await expect(page.locator('mat-dialog-container')).toHaveCount(0);
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page).toHaveURL(/\/operations\/campaigns$/);
        expect(getLastWrite()).toBeNull();

        await page.goto('/operations/campaigns/new');
        await page.locator('#name input, input#name, [name="name"] input').first().fill('New Sky');
        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page).toHaveURL(/\/operations\/campaigns$/);
        expect(getLastWrite()?.method).toBe('POST');
        expect(getLastWrite()?.path).toBe('/campaigns');
        expect(getLastWrite()?.body).toContain('New Sky');

        resetLastWrite();
        await page.goto('/operations/campaigns/c1/edit');
        await expect(page.getByText('Edit campaign')).toBeVisible();
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1$/);
        expect(getLastWrite()?.method).toBe('PUT');
        expect(getLastWrite()?.path).toBe('/campaigns');

        resetLastWrite();
        await page.goto('/operations/campaigns/c1/operations/new');
        await page.locator('#title input, input#title, [name="title"] input').first().fill('Charlie');
        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1$/);
        expect(getLastWrite()?.path).toBe('/campaigns/c1/operations');

        resetLastWrite();
        await page.goto('/operations/campaigns/c1/operations/op1/edit');
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1\/operations\/op1$/);
        expect(getLastWrite()?.method).toBe('PUT');

        resetLastWrite();
        await page.goto('/operations/campaigns/c1/intel/new');
        await page.locator('#title input, input#title, [name="title"] input').first().fill('New intel');
        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1$/);
        expect(getLastWrite()?.path).toBe('/intelpages');
        expect(getLastWrite()?.body).toContain('"scope":0');
        expect(getLastWrite()?.body).toContain('"ownerId":"c1"');

        resetLastWrite();
        await page.goto('/operations/campaigns/c1/operations/op1/intel/i2/edit');
        await expect(page.getByText('Edit intel page')).toBeVisible();
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page).toHaveURL(/\/intel\/i2$/);
        expect(getLastWrite()?.method).toBe('PUT');

        await page.goto('/operations/campaigns/c1/operations/op1/missions/m1/intel/new');
        await expect(page.locator('app-operations-intel-editor')).toBeVisible();
        await page.goto('/operations/campaigns/c2/operations/op1/intel/i2/edit');
        await expect(page.getByText('Not found')).toBeVisible();
    });

    test('TESTER gate redirects members away from editor routes', async ({ page }) => {
        await installIsolation(page, memberRoles);
        await page.goto('/operations/campaigns/new');
        await expect(page).not.toHaveURL(/\/operations\/campaigns\/new$/);
        await page.goto('/operations/campaigns/c1/edit');
        await expect(page).not.toHaveURL(/\/edit$/);
    });

    test('empty docs-parity editor fills remaining page height without overflow', async ({ page }, testInfo) => {
        await installIsolation(page, commandRoles);
        await page.goto('/operations/campaigns/new');
        const campaignEditor = page.locator('app-docs-editor');
        await expect(campaignEditor.locator('.ql-toolbar')).toBeVisible();
        const campaignBox = await campaignEditor.locator('.content').boundingBox();
        expect(campaignBox).toBeTruthy();
        const viewport = page.viewportSize()!;
        expect(campaignBox!.height).toBeGreaterThan(viewport.height * 0.35);
        expect(viewport.height - (campaignBox!.y + campaignBox!.height)).toBeLessThan(48);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
        expect(await campaignEditor.locator('.content-editor').evaluate((el) => getComputedStyle(el).maxWidth)).toBe('900px');
        expect(await campaignEditor.locator('.ql-toolbar').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
        await page.screenshot({ path: `${scratch}/campaign-new-${testInfo.project.name}.png`, fullPage: true });

        await page.goto('/operations/campaigns/c1/operations/op1/missions/m1/warno');
        await page.getByRole('button', { name: 'Edit' }).click();
        const warnoEditor = page.locator('app-docs-editor');
        await expect(warnoEditor.locator('.ql-toolbar')).toBeVisible();
        const warnoBox = await warnoEditor.locator('.content').boundingBox();
        expect(warnoBox).toBeTruthy();
        expect(warnoBox!.height).toBeGreaterThan(viewport.height * 0.35);
        expect(viewport.height - (warnoBox!.y + warnoBox!.height)).toBeLessThan(48);
        await page.screenshot({ path: `${scratch}/warno-edit-${testInfo.project.name}.png`, fullPage: true });

        await page.goto('/information/docs?folder=f1&document=d1');
        await expect(page.locator('app-docs-content .document-title')).toHaveText('SOP');
        await page.locator('app-docs-content').getByRole('button', { name: 'Edit' }).click();
        const docsEditor = page.locator('app-docs-content app-docs-editor');
        await expect(docsEditor.locator('.ql-toolbar')).toBeVisible();
        expect(await docsEditor.locator('.content-editor').evaluate((el) => getComputedStyle(el).maxWidth)).toBe('900px');
        expect(await docsEditor.locator('.ql-toolbar').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
        await page.screenshot({ path: `${scratch}/docs-edit-${testInfo.project.name}.png`, fullPage: true });
    });
});
