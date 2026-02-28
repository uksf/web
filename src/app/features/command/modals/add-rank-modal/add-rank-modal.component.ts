import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { RanksService } from '../../services/ranks.service';
import { AutofocusStopComponent } from '../../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';

@Component({
    selector: 'app-add-rank-modal',
    templateUrl: './add-rank-modal.component.html',
    styleUrls: ['./add-rank-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, TextInputComponent, MatDialogActions, ButtonComponent]
})
export class AddRankModalComponent {
    private formBuilder = inject(FormBuilder);
    private ranksService = inject(RanksService);
    private dialog = inject(MatDialog);

    form = this.formBuilder.group({
        name: ['', Validators.required, this.validateRank.bind(this)],
        abbreviation: ['', Validators.required],
        teamspeakGroup: ['', null, this.validateRank.bind(this)],
        discordRoleId: ['']
    });
    pending = false;

    validationMessages = {
        name: [
            { type: 'required', message: 'Name is required' },
            { type: 'rankTaken', message: 'That name is already in use' }
        ],
        abbreviation: [{ type: 'required', message: 'Abbreviation is required' }],
        teamspeakGroup: [{ type: 'rankTaken', message: 'That ID is already in use' }]
    };

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.ranksService
            .addRank(JSON.stringify(this.form.getRawValue()))
            .pipe(first())
            .subscribe({
                next: (_) => {
                    this.dialog.closeAll();
                    this.pending = false;
                }
            });
    }

    private validateRank(control: AbstractControl): Observable<ValidationErrors> {
        return timer(200).pipe(
            switchMap(() => {
                if (control.pristine || !control.value) {
                    return of(null);
                }
                return this.ranksService.checkRankName(control.value).pipe(map((response) => (response ? { rankTaken: true } : null)));
            })
        );
    }
}
