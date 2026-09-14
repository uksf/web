import { test, expect } from '@playwright/test';
import { commandRoles, commandWithoutTesterRoles, getLastWrite, installIsolation, memberRoles, resetLastWrite } from './hierarchy-harness';

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

    test('Create stays disabled until delayed campaign GET resolves', async ({ page }) => {
        await installIsolation(page, commandRoles);
        await page.route('**/campaigns/c1', async (route) => {
            if (route.request().method() !== 'GET') {
                return route.fallback();
            }
            await new Promise((r) => setTimeout(r, 800));
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ id: 'c1', name: 'Iron Sky', summary: '', status: 0 })
            });
        });
        const nav = page.goto('/operations/campaigns/c1/operations/new');
        await expect(page.locator('app-operations-operation-editor')).toBeVisible();
        await page.locator('#title input, input#title, [name="title"] input').first().fill('Charlie');
        await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
        expect(getLastWrite()).toBeNull();
        await nav;
        await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled({ timeout: 5000 });
    });

    test('TESTER gate redirects members and COMMAND-without-TESTER; TESTER+COMMAND enters', async ({ page }) => {
        await installIsolation(page, memberRoles);
        await page.goto('/operations/campaigns/new');
        await expect(page).not.toHaveURL(/\/operations\/campaigns\/new$/);
        await page.goto('/operations/campaigns/c1/edit');
        await expect(page).not.toHaveURL(/\/edit$/);

        await installIsolation(page, commandWithoutTesterRoles);
        await page.goto('/operations/campaigns/new');
        await expect(page).not.toHaveURL(/\/operations\/campaigns\/new$/);
        await page.goto('/operations/campaigns/c1/operations/new');
        await expect(page).not.toHaveURL(/\/operations\/new$/);
        await page.goto('/operations/campaigns/c1/intel/new');
        await expect(page).not.toHaveURL(/\/intel\/new$/);

        await installIsolation(page, commandRoles);
        await page.goto('/operations/campaigns/new');
        await expect(page.locator('app-operations-campaign-editor')).toBeVisible();
        await page.goto('/operations/campaigns/c1/operations/new');
        await expect(page.locator('app-operations-operation-editor')).toBeVisible();
        await page.goto('/operations/campaigns/c1/intel/new');
        await expect(page.locator('app-operations-intel-editor')).toBeVisible();
    });

    test('empty docs-parity editor fills remaining page height with debugForms true and false', async ({ page }, testInfo) => {
        const viewport = page.viewportSize()!;
        const assertFullHeight = async (label: string) => {
            const editor = page.locator('app-docs-editor').first();
            await expect(editor.locator('.ql-toolbar')).toBeVisible();
            const box = await editor.locator('.content').boundingBox();
            expect(box, label).toBeTruthy();
            expect(box!.height, label).toBeGreaterThan(viewport.height * 0.35);
            expect(viewport.height - (box!.y + box!.height), label).toBeLessThan(48);
            expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
            expect(await editor.locator('.content-editor').evaluate((el) => getComputedStyle(el).maxWidth)).toBe('900px');
            expect(await editor.locator('.ql-toolbar').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
        };

        for (const debugForms of [false, true]) {
            await installIsolation(page, commandRoles, { debugForms });
            await page.goto('/operations/campaigns/new');
            await assertFullHeight(`campaign debugForms=${debugForms}`);
            if (debugForms) {
                await expect(page.locator('app-form-value-debug-template pre')).toBeVisible();
            }
            await page.screenshot({ path: `${scratch}/campaign-new-debug-${debugForms}-${testInfo.project.name}.png`, fullPage: true });

            await page.goto('/operations/campaigns/c1/operations/new');
            await assertFullHeight(`operation debugForms=${debugForms}`);

            await page.goto('/operations/campaigns/c1/intel/new');
            await assertFullHeight(`intel debugForms=${debugForms}`);
        }

        await installIsolation(page, commandRoles, { debugForms: false });
        await page.goto('/operations/campaigns/c1/operations/op1/missions/m1/warno');
        await page.getByRole('button', { name: 'Edit' }).click();
        await assertFullHeight('warno empty editor');
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
