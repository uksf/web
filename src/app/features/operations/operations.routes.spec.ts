import { describe, it, expect } from 'vitest';
import { Route, Routes } from '@angular/router';
import { Permissions } from '@app/core/services/permissions';
import { OPERATIONS_ROUTES } from './operations.routes';

describe('OPERATIONS_ROUTES root redirect', () => {
    it('redirects everyone to campaigns', () => {
        const children: Routes = OPERATIONS_ROUTES[0].children ?? [];
        const root = children.find((r: Route) => r.path === '' && r.pathMatch === 'full');
        expect(root?.redirectTo).toBe('campaigns');
    });
});

describe('OPERATIONS_ROUTES hierarchy paths', () => {
    const children: Routes = OPERATIONS_ROUTES[0].children ?? [];
    const paths = children.map((r) => r.path);

    it('keeps unrelated redirects and file-library missions route', () => {
        expect(paths).toContain('activity');
        expect(paths).toContain('orders');
        expect(paths).toContain('reports');
        expect(paths).toContain('opords');
        expect(paths).toContain('opreps');
        expect(paths).toContain('missions');
        expect(paths).toContain('aar');
        expect(paths).toContain('servers');
    });

    it('uses campaignId, operationId and missionId on nested campaign routes', () => {
        expect(paths).toContain('campaigns/new');
        expect(paths).toContain('campaigns/:campaignId');
        expect(paths).toContain('campaigns/:campaignId/edit');
        expect(paths).toContain('campaigns/:campaignId/intel/new');
        expect(paths).toContain('campaigns/:campaignId/intel/:intelId');
        expect(paths).toContain('campaigns/:campaignId/intel/:intelId/edit');
        expect(paths).toContain('campaigns/:campaignId/operations/new');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/edit');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/intel/new');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/intel/:intelId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/intel/:intelId/edit');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/missions/:missionId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/missions/:missionId/intel/new');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/missions/:missionId/intel/:intelId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/missions/:missionId/intel/:intelId/edit');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/missions/:missionId/warno');
    });

    it('has no old playable /ops aliases', () => {
        expect(paths.some((p) => p?.includes('/ops'))).toBe(false);
        expect(paths).not.toContain('campaigns/:id');
        expect(paths).not.toContain('campaigns/:id/ops/:opId');
    });

    it('opens every campaign hierarchy route to members', () => {
        const hierarchy = children.filter((r) => r.path?.startsWith('campaigns'));
        expect(hierarchy.length).toBe(18);
        for (const route of hierarchy) {
            expect(route.data?.['permissions']?.only).toBe(Permissions.MEMBER);
            expect(route.canActivate).toBeTruthy();
        }
    });
});
