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

    it('shows Campaigns and AAR for a plain member', () => {
        expect(labelsFor(['MEMBER'])).toEqual(['Campaigns', 'AAR']);
    });

    it('orders Campaigns, AAR, Missions, Servers for a member with SERVERS permission', () => {
        expect(labelsFor(['MEMBER', 'SERVERS'])).toEqual(['Campaigns', 'AAR', 'Missions', 'Servers']);
    });
});
