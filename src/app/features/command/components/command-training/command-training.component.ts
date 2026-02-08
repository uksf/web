import { Component, OnInit } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { Training } from '@app/features/command/models/training';
import { AddTrainingModalComponent } from '@app/features/command/modals/add-training-modal/add-training-modal.component';
import { TrainingsService } from '../../services/trainings.service';

@Component({
    selector: 'app-command-training',
    templateUrl: './command-training.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-training.component.scss']
})
export class CommandTrainingComponent implements OnInit {
    trainings: Training[];

    constructor(private trainingsService: TrainingsService, private dialog: MatDialog) {}

    ngOnInit() {
        this.getTrainings();
    }

    validateInlineTraining(value): Observable<boolean> {
        return timer(200).pipe(
            switchMap((): Observable<boolean> => {
                return this.trainingsService.checkUnique(value);
            })
        );
    }

    getTrainings() {
        this.trainingsService.getTrainings().pipe(first()).subscribe({
            next: (response: Training[]) => {
                this.trainings = response;
            }
        });
    }

    addTraining() {
        this.dialog
            .open(AddTrainingModalComponent, {})
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (_) => {
                    this.getTrainings();
                }
            });
    }

    editTraining(check: string) {
        const training: Training = this.trainings.find((x: Training): boolean => x.name === check || x.shortName === check || x.teamspeakGroup === check);
        if (training) {
            this.trainingsService.editTraining(training).pipe(first()).subscribe({
                next: (response: Training[]): void => {
                    this.trainings = response;
                }
            });
        }
    }

    trackByTrainingId(index: number, training: Training): string {
        return training.id;
    }

    deleteTraining(event, training) {
        event.stopPropagation();
        const dialog: MatDialogRef<ConfirmationModalComponent> = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${training.name}'?` }
        });
        dialog.afterClosed().pipe(first()).subscribe({
            next: (result): void => {
                if (result) {
                    this.trainingsService.deleteTraining(training.id).pipe(first()).subscribe({
                        next: (response: Training[]): void => {
                            this.trainings = response;
                        }
                    });
                }
            }
        });
    }
}
