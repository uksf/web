import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { TrainingsService } from '../../services/trainings.service';
import { AutofocusStopComponent } from '../../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';

@Component({
    selector: 'app-add-training-modal',
    templateUrl: './add-training-modal.component.html',
    styleUrls: ['./add-training-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, TextInputComponent, MatDialogActions, ButtonComponent]
})
export class AddTrainingModalComponent {
    form = this.formBuilder.group({
        name: ['', Validators.required, this.validateTraining.bind(this)],
        shortName: ['', null, this.validateTraining.bind(this)],
        teamspeakGroup: ['', null, this.validateTraining.bind(this)]
    });
    pending = false;

    validationMessages = {
        name: [
            { type: 'required', message: 'Name is required' },
            { type: 'trainingTaken', message: 'That name is already in use' }
        ],
        shortName: [{ type: 'trainingTaken', message: 'That short name is already in use' }],
        teamspeakGroup: [{ type: 'trainingTaken', message: 'That ID is already in use' }]
    };

    constructor(private formBuilder: FormBuilder, private trainingsService: TrainingsService, private dialog: MatDialog) {}

    submit(): void {
        if (!this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.trainingsService
            .addTraining(JSON.stringify(this.form.getRawValue()))
            .pipe(first())
            .subscribe({
                next: (_): void => {
                    this.dialog.closeAll();
                    this.pending = false;
                }
            });
    }

    private validateTraining(control: AbstractControl): Observable<ValidationErrors> {
        return timer(200).pipe(
            switchMap((): Observable<{ trainingTaken: true }> | Observable<null> => {
                if (control.pristine || !control.value) {
                    return of(null);
                }

                return this.trainingsService.checkUnique(control.value).pipe(
                    map(
                        (
                            response: boolean
                        ): {
                            trainingTaken: true;
                        } => (response ? null : { trainingTaken: true })
                    )
                );
            })
        );
    }
}
