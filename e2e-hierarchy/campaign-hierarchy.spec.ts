import { expect, test, type Locator, type Page } from '@playwright/test';
import { commandRoles, getLastWrite, installIsolation, memberRoles, resetLastWrite } from './hierarchy-harness';

const clickCenter = async (page: Page, loc: Locator) => {
    const box = await loc.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
};

test.describe.configure({ mode: 'serial' });

test.describe('isolated campaign hierarchy', () => {
    test('reads hierarchy, briefs, intel, WARNO and rendered AAR href', async ({ page }) => {
        const blocked = await installIsolation(page, commandRoles);
        await page.goto('/operations/campaigns');
        await expect(page.locator('app-operations-campaigns')).toBeVisible();
        await expect(page.getByText('Iron Sky')).toBeVisible();
        await expect(page.getByText('Altis · Tanoa')).toBeVisible();

        await page.goto('/operations/campaigns/c1');
        await expect(page.locator('app-operations-campaign-detail')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Iron Sky' })).toBeVisible();
        await expect(page.getByText('Campaign brief', { exact: false })).toBeVisible();
        await expect(page.getByText('Alpha')).toBeVisible();
        await expect(page.getByText('Bravo')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Open Alpha' })).toBeVisible();

        await page.goto('/operations/campaigns/c1/operations/op1');
        await expect(page.locator('app-operations-operation-detail')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Alpha' })).toBeVisible();
        await expect(page.getByText('Sweep')).toBeVisible();
        await expect(page.getByText('New mission')).toBeVisible();

        await page.goto('/operations/campaigns/c1/operations/op1/missions/m-aar');
        await expect(page.locator('app-operations-mission-detail')).toBeVisible();
        const aar = page.getByRole('link', { name: 'AAR' });
        await expect(aar).toBeVisible();
        await expect(aar).toHaveAttribute('href', /\/operations\/aar\?session=sess-1/);

        await page.goto('/operations/campaigns/c1/operations/op1/missions/m1/warno');
        await expect(page.locator('app-operations-warno-detail')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();

        await page.goto('/operations/campaigns/c1/intel/i1');
        await expect(page.getByRole('heading', { name: 'Campaign intel' })).toBeVisible();
        await page.goto('/operations/campaigns/c1/operations/op1/intel/i2');
        await expect(page.getByRole('heading', { name: 'Operation intel' })).toBeVisible();
        await page.goto('/operations/campaigns/c1/operations/op1/missions/m1/intel/i3');
        await expect(page.getByRole('heading', { name: 'Mission intel' })).toBeVisible();
        await expect(page.getByText('Iron Sky / Alpha / Sweep')).toBeVisible();

        await page.goto('/operations/campaigns/c2/operations/op1/intel/i2');
        await expect(page.getByText('Not found')).toBeVisible();

        const leaked = [...new Set(blocked)].filter((u) => {
            if (u.startsWith('blob:') || u.startsWith('data:')) {
                return false;
            }
            try {
                const host = new URL(u).host;
                return !host.endsWith('fonts.gstatic.com') && !host.endsWith('fonts.googleapis.com') && !host.endsWith('use.fontawesome.com');
            } catch {
                return true;
            }
        });
        expect(leaked, `non-font blocked traffic: ${leaked.join(', ')}`).toEqual([]);
    });

    test('Past campaign hides create/delete/add-intel; operation status does not', async ({ page }) => {
        await installIsolation(page, commandRoles);
        await page.goto('/operations/campaigns/c-past');
        await expect(page.getByRole('heading', { name: 'Old War' })).toBeVisible();
        await expect(page.getByText('New operation')).toHaveCount(0);
        await expect(page.getByText('Add Intel')).toHaveCount(0);

        await page.goto('/operations/campaigns/c1/operations/op2');
        await expect(page.getByRole('heading', { name: 'Bravo' })).toBeVisible();
        await expect(page.getByText('New mission')).toBeVisible();
        await expect(page.getByText('Add Intel')).toBeVisible();
    });

    test('Past campaign rejects direct create URLs; edits remain allowed', async ({ page }) => {
        await installIsolation(page, commandRoles);
        resetLastWrite();
        await page.goto('/operations/campaigns/c-past/operations/new');
        await expect(page).toHaveURL(/\/operations\/campaigns\/c-past$/);
        await expect(page.locator('app-operations-operation-editor')).toHaveCount(0);
        expect(getLastWrite()).toBeNull();

        await page.goto('/operations/campaigns/c-past/intel/new');
        await expect(page).toHaveURL(/\/operations\/campaigns\/c-past$/);
        expect(getLastWrite()).toBeNull();

        await page.goto('/operations/campaigns/c-past/operations/op-past/intel/new');
        await expect(page).toHaveURL(/\/operations\/campaigns\/c-past\/operations\/op-past$/);
        expect(getLastWrite()).toBeNull();

        await page.goto('/operations/campaigns/c-past/operations/op-past/missions/m-past/intel/new');
        await expect(page).toHaveURL(/\/missions\/m-past$/);
        expect(getLastWrite()).toBeNull();

        await page.goto('/operations/campaigns/c-past/edit');
        await expect(page.locator('app-operations-campaign-editor')).toBeVisible();
        await page.getByRole('button', { name: 'Save' }).click();
        expect(getLastWrite()?.method).toBe('PUT');

        resetLastWrite();
        await page.goto('/operations/campaigns/c-past/operations/op-past/edit');
        await expect(page.locator('app-operations-operation-editor')).toBeVisible();
        await page.getByRole('button', { name: 'Save' }).click();
        expect(getLastWrite()?.method).toBe('PUT');
    });

    test('TESTER gate redirects members away from campaigns', async ({ page }) => {
        await installIsolation(page, memberRoles);
        await page.goto('/operations/campaigns');
        await expect(page).not.toHaveURL(/\/operations\/campaigns$/);
    });

    test('mission modal is title-only gated and accepts empty filename', async ({ page }) => {
        await installIsolation(page, commandRoles);
        await page.goto('/operations/campaigns/c1/operations/op1');
        await page.getByText('New mission').click();
        const create = page.getByRole('button', { name: 'Create' });
        await expect(create).toBeDisabled();
        await page.locator('#title input, input#title, [name="title"] input').first().fill('Untitled');
        await expect(create).toBeEnabled();
        await create.click();
        await expect(page.locator('app-mission-modal')).toHaveCount(0);
    });

    test('mission card blank/status/arrow navigate; action container does not', async ({ page }) => {
        await installIsolation(page, commandRoles);
        const list = '/operations/campaigns/c1/operations/op1';
        const mission = /\/operations\/campaigns\/c1\/operations\/op1\/missions\/m1$/;
        const openList = async () => {
            await page.goto(list);
            await expect(page.getByText('Conduct brief')).toBeVisible();
        };
        await openList();
        const card = page.locator('.op-card').filter({ hasText: 'Sweep' });
        await expect(card.getByRole('link', { name: 'Open Sweep' })).toBeVisible();

        await clickCenter(page, card.locator('.pill'));
        await expect(page).toHaveURL(mission);
        await openList();

        await clickCenter(page, card.locator('.open'));
        await expect(page).toHaveURL(mission);
        await openList();

        await clickCenter(page, card.locator('.spacer'));
        await expect(page).toHaveURL(mission);
        await openList();

        await card.locator('.op-actions button').filter({ hasText: 'edit' }).click();
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1\/operations\/op1$/);
        await expect(page.locator('app-mission-modal')).toBeVisible();
        await page.keyboard.press('Escape');

        const actions = card.locator('.op-actions');
        const ab = await actions.boundingBox();
        expect(ab).toBeTruthy();
        await page.mouse.click(ab!.x + 2, ab!.y + ab!.height / 2);
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1\/operations\/op1$/);

        await card.getByRole('link', { name: 'Open Sweep' }).focus();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(mission);
        await openList();

        await card.locator('.op-actions .launch-btn').click({ force: true });
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1\/operations\/op1$/);
    });

    test('campaign card blank/theatre/title/arrow navigate; arrow is a keyboard link', async ({ page }) => {
        await installIsolation(page, commandRoles);
        const list = '/operations/campaigns';
        const target = /\/operations\/campaigns\/c1$/;
        const openList = async () => {
            await page.goto(list);
            await expect(page.getByText('Altis · Tanoa')).toBeVisible();
        };
        await openList();
        const card = page.locator('.campaign-card').filter({ hasText: 'Iron Sky' });

        for (const part of ['.theatre', '.title', '.open']) {
            await clickCenter(page, card.locator(part));
            await expect(page).toHaveURL(target);
            await openList();
        }

        const box = await card.boundingBox();
        await page.mouse.click(box!.x + box!.width * 0.75, box!.y + box!.height / 2);
        await expect(page).toHaveURL(target);
        await openList();

        await card.getByRole('link', { name: 'Open Iron Sky' }).focus();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(target);
    });

    test('operation card blank/status/title/arrow navigate; action container does not', async ({ page }) => {
        await installIsolation(page, commandRoles);
        const list = '/operations/campaigns/c1';
        const target = /\/operations\/campaigns\/c1\/operations\/op1$/;
        const openList = async () => {
            await page.goto(list);
            await expect(page.getByText('Campaign brief')).toBeVisible();
        };
        await openList();
        const card = page.locator('.op-card').filter({ hasText: 'Alpha' });

        for (const part of ['.pill', '.title', '.spacer', '.open']) {
            await clickCenter(page, card.locator(part));
            await expect(page).toHaveURL(target);
            await openList();
        }

        const actions = card.locator('.op-actions');
        const ab = await actions.boundingBox();
        await page.mouse.click(ab!.x + ab!.width / 2, ab!.y + 1);
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1$/);

        await card.locator('.op-actions button').filter({ hasText: 'edit' }).click();
        await expect(page).toHaveURL(/\/operations\/campaigns\/c1\/operations\/op1\/edit$/);
        await openList();

        await card.getByRole('link', { name: 'Open Alpha' }).focus();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(target);
    });

    test('mocked launch error and shift override', async ({ page }) => {
        await installIsolation(page, commandRoles);
        await page.goto('/operations/campaigns/c1/operations/op1/missions/m1');
        const launch = page.locator('button.launch-btn');
        await expect(launch).toBeDisabled();
        await page.keyboard.down('Shift');
        await expect(launch).toBeEnabled();
        await launch.click();
        await page.keyboard.up('Shift');
        await expect(page.getByText('Launch failed')).toBeVisible();
    });
});
