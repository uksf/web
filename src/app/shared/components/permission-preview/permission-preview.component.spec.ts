import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionPreviewComponent } from './permission-preview.component';

describe('PermissionPreviewComponent', () => {
    let component: PermissionPreviewComponent;
    let ngx: any;

    beforeEach(() => {
        ngx = {
            getPermissions: vi.fn().mockReturnValue({ MEMBER: {}, COMMAND: {} }),
            flushPermissions: vi.fn(),
            addPermission: vi.fn()
        };
        TestBed.configureTestingModule({
            providers: [PermissionPreviewComponent, { provide: NgxPermissionsService, useValue: ngx }]
        });
        component = TestBed.inject(PermissionPreviewComponent);
    });

    afterEach(() => TestBed.resetTestingModule());

    it('toggling a role applies the expanded permission set', () => {
        component.toggle('COMMAND');

        expect(ngx.flushPermissions).toHaveBeenCalled();
        const applied = ngx.addPermission.mock.calls.at(-1)[0] as string[];
        expect(applied).toEqual(expect.arrayContaining(['MEMBER', 'COMMAND', 'SERVERS', 'ACTIVITY']));
    });

    it('reset restores the original permissions snapshot', () => {
        component.toggle('ADMIN');
        component.reset();

        const applied = ngx.addPermission.mock.calls.at(-1)[0] as string[];
        expect(applied).toEqual(['MEMBER', 'COMMAND']);
        expect(component.isActive('ADMIN')).toBe(false);
    });
});
