import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { UpdateMembersTrainingModalComponent } from './update-members-training-modal.component';
import { TrainingsService } from '@app/features/command/services/trainings.service';
import { MembersService } from '@app/shared/services/members.service';

describe('UpdateMembersTrainingModalComponent', () => {
    let component: UpdateMembersTrainingModalComponent;
    let trainings: { getTrainings: ReturnType<typeof vi.fn>; bulkUpdateAccountTrainings: ReturnType<typeof vi.fn> };
    let dialog: { closeAll: ReturnType<typeof vi.fn>; open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        trainings = {
            getTrainings: vi.fn().mockReturnValue(of([{ id: 't1', name: 'Medic', shortName: 'MED', teamspeakGroup: '1' }])),
            bulkUpdateAccountTrainings: vi.fn().mockReturnValue(of(null))
        };
        dialog = { closeAll: vi.fn(), open: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                UpdateMembersTrainingModalComponent,
                { provide: TrainingsService, useValue: trainings },
                { provide: MembersService, useValue: { getMembers: vi.fn().mockReturnValue(of([])) } },
                { provide: MatDialog, useValue: dialog }
            ]
        });

        component = TestBed.inject(UpdateMembersTrainingModalComponent);
        component.form = { valid: true } as never;
    });

    it('maps trainings to dropdown elements on init', () => {
        component.ngOnInit();

        expect(component.trainings.value).toEqual([{ value: 't1', displayValue: 'Medic' }]);
    });

    it('sends every selected member and training in one call, then closes', () => {
        component.model = {
            accounts: [
                { value: 'a1', displayValue: 'A' },
                { value: 'a2', displayValue: 'B' }
            ],
            trainings: [{ value: 't1', displayValue: 'Medic' }],
            remove: true
        };

        component.submit();

        expect(trainings.bulkUpdateAccountTrainings).toHaveBeenCalledWith(['a1', 'a2'], ['t1'], true);
        expect(dialog.closeAll).toHaveBeenCalled();
    });

    it('does nothing without a member or a training', () => {
        component.model = { accounts: [{ value: 'a1', displayValue: 'A' }], trainings: [], remove: false };

        component.submit();

        expect(trainings.bulkUpdateAccountTrainings).not.toHaveBeenCalled();
    });
});
