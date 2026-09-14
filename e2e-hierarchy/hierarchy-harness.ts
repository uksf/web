import { Page, Request } from '@playwright/test';

const ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const API = 'http://localhost:5500';
const APP = 'http://127.0.0.1:4201';

function jwt(roles: string[]): string {
    const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 86400, [ROLE]: roles })}.x`;
}

export const commandRoles = ['COMMAND', 'TESTER', 'NCO', 'SERVERS'];
export const memberRoles: string[] = [];

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
const docsFolder = {
    id: 'f1',
    parent: '000000000000000000000000',
    name: 'Root',
    documents: [{ id: 'd1', folder: 'f1', name: 'SOP', canWrite: true }],
    canWrite: true
};
const docsMeta = { id: 'd1', folder: 'f1', name: 'SOP', canWrite: true };
const docsContent = { text: JSON.stringify([{ insert: '\n' }]), lastUpdated: '2026-01-01T00:00:00Z' };

let lastWrite: { method: string; path: string; body: string } | null = null;

export function getLastWrite() {
    return lastWrite;
}

export function resetLastWrite() {
    lastWrite = null;
}

function json(route: { fulfill: Function }, body: unknown, status = 200) {
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

export async function installIsolation(page: Page, roles: string[]) {
    lastWrite = null;
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
        if (url.includes('appSettings.json')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ apiUrl: API, environment: 'Development', debugForms: false })
            });
        }
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
    if (path === '/docs/folders' && method === 'GET') return json(route, [docsFolder]);
    if (path === '/docs/folders/f1/documents/d1' && method === 'GET') return json(route, docsMeta);
    if (path === '/docs/folders/f1/documents/d1/content' && method === 'GET') return json(route, docsContent);
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
    if (!path.startsWith('/hub/')) {
        lastWrite = { method, path, body: request.postData() ?? '' };
    }
    return route.fulfill({ status: 204, body: '' });
}
