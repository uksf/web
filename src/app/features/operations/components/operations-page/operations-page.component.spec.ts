import { afterEach, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgxPermissionsModule, NgxPermissionsService } from 'ngx-permissions';
import { OperationsPageComponent } from './operations-page.component';

describe('OperationsPageComponent', () => {
    let ngx: NgxPermissionsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxPermissionsModule.forRoot()],
            providers: [OperationsPageComponent]
        });
        ngx = TestBed.inject(NgxPermissionsService);
    });

    afterEach(() => TestBed.resetTestingModule());

    function labelsFor(permissions: string[]): string[] {
        ngx.loadPermissions(permissions);
        const component = TestBed.inject(OperationsPageComponent);
        return component.tabLinks().map((tab) => tab.label);
    }

    it('shows only AAR for a plain member (unchanged from before the campaigns feature)', () => {
        expect(labelsFor(['MEMBER'])).toEqual(['AAR']);
    });

    it('orders Servers, Missions, AAR for a non-tester with SERVERS permission (unchanged from before the campaigns feature)', () => {
        expect(labelsFor(['MEMBER', 'SERVERS'])).toEqual(['Servers', 'Missions', 'AAR']);
    });

    it('orders Campaigns, AAR, Missions, Servers for a tester with SERVERS permission', () => {
        expect(labelsFor(['MEMBER', 'TESTER', 'SERVERS'])).toEqual(['Campaigns', 'AAR', 'Missions', 'Servers']);
    });

    it('shows only Campaigns and AAR for a tester without SERVERS permission', () => {
        expect(labelsFor(['MEMBER', 'TESTER'])).toEqual(['Campaigns', 'AAR']);
    });
});
