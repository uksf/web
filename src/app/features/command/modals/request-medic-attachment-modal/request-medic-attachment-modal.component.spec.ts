import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { RequestMedicAttachmentModalComponent } from './request-medic-attachment-modal.component';
import { CommandRequestsService } from '@app/features/command/services/command-requests.service';
import { UnitsService } from '@app/features/command/services/units.service';

describe('RequestMedicAttachmentModalComponent', () => {
    let component: RequestMedicAttachmentModalComponent;
    let commandRequests: { createMedicAttachment: ReturnType<typeof vi.fn> };
    let dialogRef: { close: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        commandRequests = { createMedicAttachment: vi.fn().mockReturnValue(of(null)) };
        dialogRef = { close: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                RequestMedicAttachmentModalComponent,
                { provide: CommandRequestsService, useValue: commandRequests },
                { provide: UnitsService, useValue: { getAllUnits: vi.fn().mockReturnValue(of([])) } },
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { ids: ['rec'] } }
            ]
        });

        component = TestBed.inject(RequestMedicAttachmentModalComponent);
    });

    it('should call createMedicAttachment with selected troop and close dialog on submit', () => {
        component.selectedTroopId = 'troop';
        component.submit();
        expect(commandRequests.createMedicAttachment).toHaveBeenCalledWith({ recipient: 'rec', troopId: 'troop', reason: '' });
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
});
