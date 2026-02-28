import { Component, OnInit } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Training } from '@app/features/command/models/training';
import { AddTrainingModalComponent } from '@app/features/command/modals/add-training-modal/add-training-modal.component';
import { TrainingsService } from '../../services/trainings.service';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { InlineEditComponent } from '../../../../shared/components/elements/inline-edit/inline-edit.component';
import { FormsModule } from '@angular/forms';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    selector: 'app-command-training',
    templateUrl: './command-training.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-training.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        MatProgressSpinner,
        NgxPermissionsModule,
        MatButton,
        MatCard,
        InlineEditComponent,
        FormsModule,
        FlexFillerComponent,
        MatIcon,
        MatTooltip
    ]
})
export class CommandTrainingComponent implements OnInit {
    trainings: Training[];
    private validatorCache = new Map<string, (value: string) => Observable<boolean>>();

    constructor(private trainingsService: TrainingsService, private dialog: MatDialog) {}

    ngOnInit() {
        this.getTrainings();
    }

    getInlineValidator(name: string): (value: string) => Observable<boolean> {
        if (!this.validatorCache.has(name)) {
            this.validatorCache.set(name, (value: string) => {
                return timer(200).pipe(
                    switchMap((): Observable<boolean> => {
                        return this.trainingsService.checkUnique(value);
                    })
                );
            });
        }
        return this.validatorCache.get(name);
    }

    getTrainings() {
        this.trainingsService
            .getTrainings()
            .pipe(first())
            .subscribe({
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
            this.trainingsService
                .editTraining(training)
                .pipe(first())
                .subscribe({
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
        dialog
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result): void => {
                    if (result) {
                        this.trainingsService
                            .deleteTraining(training.id)
                            .pipe(first())
                            .subscribe({
                                next: (response: Training[]): void => {
                                    this.trainings = response;
                                }
                            });
                    }
                }
            });
    }
}
