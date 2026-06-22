import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { RequestMedicAttachmentModalComponent } from './request-medic-attachment-modal.component';
import { CommandRequestsService } from '@app/features/command/services/command-requests.service';
import { UnitsService } from '@app/features/command/services/units.service';
import { MembersService } from '@app/shared/services/members.service';

describe('RequestMedicAttachmentModalComponent', () => {
    let component: RequestMedicAttachmentModalComponent;
    let commandRequests: { createMedicAttachment: ReturnType<typeof vi.fn> };
    let dialog: { closeAll: ReturnType<typeof vi.fn>; open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        commandRequests = { createMedicAttachment: vi.fn().mockReturnValue(of(null)) };
        dialog = { closeAll: vi.fn(), open: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                RequestMedicAttachmentModalComponent,
                { provide: CommandRequestsService, useValue: commandRequests },
                { provide: UnitsService, useValue: { getUnits: vi.fn().mockReturnValue(of([])) } },
                { provide: MembersService, useValue: { getMembers: vi.fn().mockReturnValue(of([])) } },
                { provide: MatDialog, useValue: dialog },
                { provide: MAT_DIALOG_DATA, useValue: { ids: ['rec'] } }
            ]
        });

        component = TestBed.inject(RequestMedicAttachmentModalComponent);
    });

    it('submits createMedicAttachment per recipient and closes', () => {
        component.model.accounts = [{ value: 'rec', displayValue: 'X' }];
        component.model.troop = { value: 'troop', displayValue: '3 Troop' };
        component.model.reason = 'r';
        component.form = { valid: true } as never;

        component.submit();

        expect(commandRequests.createMedicAttachment).toHaveBeenCalledWith({ recipient: 'rec', troopId: 'troop', reason: 'r' });
        expect(dialog.closeAll).toHaveBeenCalled();
    });

    it('detaches with empty troopId when no troop selected', () => {
        component.model.accounts = [{ value: 'rec', displayValue: 'X' }];
        component.model.troop = null;
        component.model.reason = 'r';
        component.form = { valid: true } as never;

        component.submit();

        expect(commandRequests.createMedicAttachment).toHaveBeenCalledWith({ recipient: 'rec', troopId: '', reason: 'r' });
    });

    it('does nothing when the form is invalid', () => {
        component.form = { valid: false } as never;
        component.submit();
        expect(commandRequests.createMedicAttachment).not.toHaveBeenCalled();
    });
});
