import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { Observable, of, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { RanksService } from '../../services/ranks.service';

@Component({
    selector: 'app-add-rank-modal',
    templateUrl: './add-rank-modal.component.html',
    styleUrls: ['./add-rank-modal.component.scss']
})
export class AddRankModalComponent implements OnInit {
    form = this.formBuilder.group({
        name: ['', Validators.required, this.validateRank.bind(this)],
        abbreviation: ['', Validators.required],
        teamspeakGroup: ['', null, this.validateRank.bind(this)],
        discordRoleId: ['']
    });
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;

    validationMessages = {
        name: [
            { type: 'required', message: 'Name is required' },
            { type: 'rankTaken', message: 'That name is already in use' }
        ],
        abbreviation: [{ type: 'required', message: 'Abbreviation is required' }],
        teamspeakGroup: [{ type: 'rankTaken', message: 'That ID is already in use' }]
    };

    constructor(private formBuilder: FormBuilder, private ranksService: RanksService, private dialog: MatDialog) {}

    trackByIndex(index: number): number {
        return index;
    }

    ngOnInit() {}

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.ranksService.addRank(JSON.stringify(this.form.getRawValue())).pipe(first()).subscribe({
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
