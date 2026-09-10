import { test, expect, Page, Request } from '@playwright/test';

const ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const API = 'http://localhost:5500';
const APP = 'http://127.0.0.1:4201';

function jwt(roles: string[]): string {
    const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 86400, [ROLE]: roles })}.x`;
}

const commandRoles = ['COMMAND', 'TESTER', 'NCO', 'SERVERS'];
const memberRoles: string[] = [];

const account = {
    id: 'u1',
    membershipState: 2,
    teamspeakIdentities: [1],
    steamname: 'tester',
    discordId: '123',
    firstname: 'Test',
    lastname: 'User',
    email: 'test@local'
};

const campaign = { id: 'c1', name: 'Iron Sky', summary: JSON.stringify([{ insert: 'Campaign brief\n' }]), status: 0 };
const pastCampaign = { id: 'c-past', name: 'Old War', summary: JSON.stringify([{ insert: 'Past brief\n' }]), status: 1 };
const operation = { id: 'op1', campaignId: 'c1', title: 'Alpha', brief: JSON.stringify([{ insert: 'Conduct brief\n' }]), status: 1 };
const siblingOperation = { id: 'op2', campaignId: 'c1', title: 'Bravo', brief: JSON.stringify([{ insert: 'Other brief\n' }]), status: 2 };
const scheduledMission = {
    id: 'm1',
    operationId: 'op1',
    title: 'Sweep',
    scheduledTime: '2026-06-28T18:00:00Z',
    serverId: 's1',
    missionName: 'sweep.Altis.pbo',
    warno: JSON.stringify([{ insert: 'WARNO body\n' }]),
    status: 0,
    autoLaunch: true
};
const completeMission = {
    id: 'm-aar',
    operationId: 'op1',
    title: 'Done',
    scheduledTime: '2026-06-21T18:00:00Z',
    serverId: 's1',
    missionName: 'done.Tanoa.pbo',
    warno: JSON.stringify([{ insert: 'old\n' }]),
    status: 1,
    autoLaunch: false,
    sessionId: 'sess-1'
};
const scheduledDto = { mission: scheduledMission, missionFileState: 0 };
const completeDto = { mission: completeMission, missionFileState: 1 };
const campaignIntel = { id: 'i1', scope: 0, ownerId: 'c1', title: 'Campaign intel', body: JSON.stringify([{ insert: 'ci\n' }]) };
const operationIntel = { id: 'i2', scope: 1, ownerId: 'op1', title: 'Operation intel', body: JSON.stringify([{ insert: 'oi\n' }]) };
const missionIntel = { id: 'i3', scope: 2, ownerId: 'm1', title: 'Mission intel', body: JSON.stringify([{ insert: 'mi\n' }]) };

function json(route: { fulfill: Function }, body: unknown, status = 200) {
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function installIsolation(page: Page, roles: string[]) {
    const token = jwt(roles);
    const blocked: string[] = [];
    await page.addInitScript((t) => {
        sessionStorage.setItem('access_token', t);
        localStorage.setItem('access_token', t);
    }, token);
    await page.routeWebSocket(/./, (ws) => ws.close());
    await page.route('**/*', async (route) => {
        const request = route.request();
        const url = request.url();
        if (url.startsWith(APP)) {
            return route.continue();
        }
        if (url.startsWith(API) || url.includes('localhost:5500')) {
            return fulfillApi(route, request, token);
        }
        blocked.push(url);
        return route.abort();
    });
    return blocked;
}

async function fulfillApi(route: { fulfill: Function }, request: Request, token: string) {
    const url = request.url();
    const method = request.method();
    const path = url.replace(API, '').split('?')[0];

    if (path === '/auth/refresh' && method === 'GET') {
        return json(route, { token });
    }
    if (path === '/accounts' && method === 'GET') {
        return json(route, account);
    }
    if (path === '/gameservers' && method === 'GET') {
        return json(route, { servers: [{ id: 's1', name: 'Main Server' }], missions: [], instanceCount: 0 });
    }
    if (path === '/missions' && method === 'GET') {
        return json(route, [{ map: 'Altis', name: 'sweep', path: 'sweep.Altis.pbo', size: 1, lastModified: '' }]);
    }
    if (path.startsWith('/intelpages') && method === 'GET') {
        if (url.includes('scope=2')) return json(route, [missionIntel]);
        if (url.includes('scope=1')) return json(route, [operationIntel]);
        return json(route, [campaignIntel]);
    }
    if (path === '/campaigns' && method === 'GET') {
        return json(route, [campaign, pastCampaign]);
    }
    if (path === '/campaigns/c1' && method === 'GET') return json(route, campaign);
    if (path === '/campaigns/c-past' && method === 'GET') return json(route, pastCampaign);
    if (path === '/campaigns/c1/operations' && method === 'GET') return json(route, [operation, siblingOperation]);
    if (path === '/campaigns/c-past/operations' && method === 'GET') return json(route, []);
    if (path === '/campaigns/c1/operations/op1' && method === 'GET') return json(route, operation);
    if (path === '/campaigns/c1/operations/op2' && method === 'GET') return json(route, siblingOperation);
    if (path === '/campaigns/c2/operations/op1' && method === 'GET') return json(route, {}, 404);
    if (path === '/campaigns/c1/operations/op1/missions' && method === 'GET') return json(route, [scheduledDto, completeDto]);
    if (path === '/campaigns/c1/operations/op2/missions' && method === 'GET') return json(route, []);
    if (path === '/campaigns/c1/operations/op1/missions/m1' && method === 'GET') return json(route, scheduledDto);
    if (path === '/campaigns/c1/operations/op1/missions/m-aar' && method === 'GET') return json(route, completeDto);
    if (path === '/campaigns/c1/missions' && method === 'GET') return json(route, [scheduledDto, completeDto]);
    if (path === '/campaigns/c-past/missions' && method === 'GET') return json(route, []);
    if (path.endsWith('/launch') && method === 'POST') {
        return json(route, { error: 'Launch failed', statusCode: 400 }, 400);
    }
    if (method === 'GET') return json(route, []);
    return route.fulfill({ status: 204, body: '' });
}

test.describe.configure({ mode: 'serial' });

test.describe('isolated campaign hierarchy', () => {
    test('reads hierarchy, briefs, intel, WARNO and rendered AAR href', async ({ page }) => {
        const blocked = await installIsolation(page, commandRoles);
        await page.goto('/operations/campaigns');
        await expect(page.locator('app-operations-campaigns')).toBeVisible();
        await expect(page.getByText('Iron Sky')).toBeVisible();
        await expect(page.getByText('Altis')).toBeVisible();

        await page.goto('/operations/campaigns/c1');
        await expect(page.locator('app-operations-campaign-detail')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Iron Sky' })).toBeVisible();
        await expect(page.getByText('Campaign brief', { exact: false })).toBeVisible();
        await expect(page.getByText('Alpha')).toBeVisible();
        await expect(page.getByText('Bravo')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Alpha' })).toBeVisible();

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
