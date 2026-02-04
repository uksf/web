import { Component } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/Services/formhelper.service';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-add-training-modal',
    templateUrl: './add-training-modal.component.html',
    styleUrls: ['./add-training-modal.component.scss']
})
export class AddTrainingModalComponent {
    form: UntypedFormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;

    validationMessages = {
        name: [
            { type: 'required', message: 'Name is required' },
            { type: 'trainingTaken', message: 'That name is already in use' }
        ],
        shortName: [{ type: 'trainingTaken', message: 'That short name is already in use' }],
        teamspeakGroup: [{ type: 'trainingTaken', message: 'That ID is already in use' }]
    };

    constructor(formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {
        this.form = formbuilder.group({
            name: ['', Validators.required, this.validateTraining.bind(this)],
            shortName: ['', null, this.validateTraining.bind(this)],
            teamspeakGroup: ['', null, this.validateTraining.bind(this)]
        });
    }

    submit(): void {
        if (!this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.httpClient
            .post(`${this.urls.apiUrl}/trainings`, JSON.stringify(this.form.getRawValue()), {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
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

                return this.httpClient.get(`${this.urls.apiUrl}/trainings/check-unique?check=${control.value}`, {}).pipe(
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
