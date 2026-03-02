import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PersonnelLoasListComponent } from './personnel-loas-list.component';
import { of } from 'rxjs';
import { Loa, LoaReviewState } from '@app/features/command/models/loa';
import { LoaService } from '@app/shared/services/loa.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatDialog } from '@angular/material/dialog';

describe('PersonnelLoasListComponent', () => {
    let component: PersonnelLoasListComponent;
    let mockLoaService: any;
    let mockPermissions: any;
    let mockDialog: any;

    const makeLoa = (overrides: Partial<Loa> = {}): Loa => ({
        id: 'loa-1',
        submitted: new Date(),
        start: new Date(),
        end: new Date(),
        state: LoaReviewState.APPROVED,
        reason: 'Holiday',
        emergency: false,
        late: false,
        name: 'John Doe',
        inChainOfCommand: false,
        longTerm: false,
        ...overrides
    });

    beforeEach(() => {
        mockLoaService = {
            getLoas: vi.fn().mockReturnValue(of({ data: [], totalCount: 0 }))
        };
        mockPermissions = {
            hasPermission: vi.fn().mockReturnValue(false)
        };
        mockDialog = { open: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                PersonnelLoasListComponent,
                { provide: LoaService, useValue: mockLoaService },
                { provide: PermissionsService, useValue: mockPermissions },
                { provide: MatDialog, useValue: mockDialog },
            ]
        });
        component = TestBed.inject(PersonnelLoasListComponent);
    });

    describe('updateComputedProperties', () => {
        it('should set _canViewReason true when loa.inChainOfCommand is true', () => {
            component.loas = [makeLoa({ inChainOfCommand: true })];

            component.updateComputedProperties();

            expect(component.loas[0]._canViewReason).toBe(true);
        });

        it('should set _canViewReason false when no permissions and not in chain', () => {
            component.loas = [makeLoa({ inChainOfCommand: false })];

            component.updateComputedProperties();

            expect(component.loas[0]._canViewReason).toBe(false);
        });

        it('should set _canViewReason true when user has NCO permission', () => {
            mockPermissions.hasPermission.mockReturnValue(true);
            component.loas = [makeLoa({ inChainOfCommand: false })];

            component.updateComputedProperties();

            expect(component.loas[0]._canViewReason).toBe(true);
        });

        it('should set _canDelete based on deletable and permissions', () => {
            component.deletable = true;
            component.loas = [makeLoa({ inChainOfCommand: true })];

            component.updateComputedProperties();

            expect(component.loas[0]._canDelete).toBe(true);
        });
    });

});
