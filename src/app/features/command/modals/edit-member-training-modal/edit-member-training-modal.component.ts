import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { EditMemberTrainingModalData, EditTrainingItem, Training } from '@app/features/command/models/training';
import { first } from 'rxjs/operators';
import { TrainingsService } from '../../services/trainings.service';

@Component({
    selector: 'app-edit-member-training-modal',
    templateUrl: './edit-member-training-modal.component.html',
    styleUrls: ['./edit-member-training-modal.component.scss']
})
export class EditMemberTrainingModalComponent implements OnInit {
    accountId: string;
    name: string;
    trainings: Training[];
    availableTrainings: EditTrainingItem[];
    before: string;

    constructor(private trainingsService: TrainingsService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: EditMemberTrainingModalData) {
        if (data) {
            this.accountId = data.accountId;
            this.name = data.name;
            this.trainings = data.trainings;
        }
    }

    get changes() {
        return JSON.stringify(this.availableTrainings) !== this.before;
    }

    ngOnInit() {
        this.trainingsService.getTrainings().pipe(first()).subscribe({
            next: (response: Training[]): void => {
                this.availableTrainings = response.map((training: Training): EditTrainingItem => {
                    return { ...training, selected: !!this.trainings.find((x: Training): boolean => x.id === training.id) };
                });
                this.before = JSON.stringify(this.availableTrainings);
            }
        });
    }

    trackByTrainingId(index: number, training: EditTrainingItem): string {
        return training.id;
    }

    save() {
        const trainingIds: string[] = this.availableTrainings.filter((training: EditTrainingItem): boolean => training.selected).map((training: EditTrainingItem): string => training.id);

        this.trainingsService.updateAccountTrainings(this.accountId, trainingIds).pipe(first()).subscribe({
            next: (_) => {
                this.dialog.closeAll();
            }
        });
    }
}
