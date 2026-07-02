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
