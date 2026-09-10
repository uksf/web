import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Route, Routes } from '@angular/router';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Permissions } from '@app/core/services/permissions';
import { OPERATIONS_ROUTES } from './operations.routes';

describe('OPERATIONS_ROUTES root redirect', () => {
    let hasPermission: ReturnType<typeof vi.fn>;

    // The root child route: empty path, pathMatch full, functional redirectTo.
    function rootRedirect(): (...args: unknown[]) => string {
        const children: Routes = OPERATIONS_ROUTES[0].children ?? [];
        const root = children.find((r: Route) => r.path === '' && r.pathMatch === 'full' && typeof r.redirectTo === 'function');
        return root!.redirectTo as (...args: unknown[]) => string;
    }

    function resolve(): string {
        return TestBed.runInInjectionContext(() => rootRedirect()({} as never));
    }

    beforeEach(() => {
        hasPermission = vi.fn();
        TestBed.configureTestingModule({
            providers: [{ provide: PermissionsService, useValue: { hasPermission } }]
        });
    });

    afterEach(() => TestBed.resetTestingModule());

    it('redirects testers to campaigns', () => {
        hasPermission.mockImplementation((p: string) => p === Permissions.TESTER);
        expect(resolve()).toBe('campaigns');
    });

    it('redirects non-testers to servers (unchanged pre-campaigns default)', () => {
        hasPermission.mockReturnValue(false);
        expect(resolve()).toBe('servers');
    });

    it('checks the TESTER permission specifically', () => {
        hasPermission.mockReturnValue(false);
        resolve();
        expect(hasPermission).toHaveBeenCalledWith(Permissions.TESTER);
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
        expect(paths).toContain('campaigns/:campaignId');
        expect(paths).toContain('campaigns/:campaignId/intel/:intelId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/intel/:intelId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/missions/:missionId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/missions/:missionId/intel/:intelId');
        expect(paths).toContain('campaigns/:campaignId/operations/:operationId/missions/:missionId/warno');
    });

    it('has no old playable /ops aliases', () => {
        expect(paths.some((p) => p?.includes('/ops'))).toBe(false);
        expect(paths).not.toContain('campaigns/:id');
        expect(paths).not.toContain('campaigns/:id/ops/:opId');
    });

    it('gates every campaign hierarchy route on TESTER', () => {
        const hierarchy = children.filter((r) => r.path?.startsWith('campaigns'));
        expect(hierarchy.length).toBe(8);
        for (const route of hierarchy) {
            expect(route.data?.['permissions']?.only).toBe(Permissions.TESTER);
            expect(route.canActivate).toBeTruthy();
        }
    });
});
