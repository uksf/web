import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { CommandMemberCardComponent } from './command-member-card.component';
import { RequestMedicAttachmentModalComponent } from '@app/features/command/modals/request-medic-attachment-modal/request-medic-attachment-modal.component';
import { MembersService } from '@app/shared/services/members.service';

describe('CommandMemberCardComponent', () => {
    let component: CommandMemberCardComponent;
    let dialog: { open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        dialog = { open: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                CommandMemberCardComponent,
                { provide: MatDialog, useValue: dialog },
                { provide: MembersService, useValue: { updateQualifications: vi.fn() } }
            ]
        });

        component = TestBed.inject(CommandMemberCardComponent);
    });

    describe('isSfmMember', () => {
        it('returns true when unitObjects contains an entry with shortname SFM', () => {
            component.member = { id: 'rec', unitObjects: [{ shortname: 'SFM' }] } as any;
            expect(component.isSfmMember).toBe(true);
        });

        it('returns false when unitObjects has no SFM entry', () => {
            component.member = { id: 'rec', unitObjects: [{ shortname: 'OTHER' }] } as any;
            expect(component.isSfmMember).toBe(false);
        });

        it('returns false when unitObjects is empty', () => {
            component.member = { id: 'rec', unitObjects: [] } as any;
            expect(component.isSfmMember).toBe(false);
        });

        it('returns false when unitObjects is undefined', () => {
            component.member = { id: 'rec', unitObjects: undefined } as any;
            expect(component.isSfmMember).toBe(false);
        });
    });

    describe('editMedicAttachment', () => {
        it('opens RequestMedicAttachmentModalComponent with member id', () => {
            component.member = { id: 'rec', unitObjects: [{ shortname: 'SFM' }] } as any;
            component.editMedicAttachment();
            expect(dialog.open).toHaveBeenCalledWith(RequestMedicAttachmentModalComponent, expect.anything());
        });
    });
});
