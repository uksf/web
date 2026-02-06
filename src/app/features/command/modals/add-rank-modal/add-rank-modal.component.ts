import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-add-rank-modal',
    templateUrl: './add-rank-modal.component.html',
    styleUrls: ['./add-rank-modal.component.scss']
})
export class AddRankModalComponent implements OnInit {
    form: UntypedFormGroup;
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

    constructor(formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {
        this.form = formbuilder.group({
            name: ['', Validators.required, this.validateRank.bind(this)],
            abbreviation: ['', Validators.required],
            teamspeakGroup: ['', null, this.validateRank.bind(this)],
            discordRoleId: ['']
        });
    }

    trackByIndex(index: number): number {
        return index;
    }

    ngOnInit() {}

    submit() {
        if (!this.form.valid || this.pending) {
            return;
        }

        this.pending = true;
        this.httpClient
            .post(`${this.urls.apiUrl}/ranks`, JSON.stringify(this.form.getRawValue()), {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            })
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
                return this.httpClient.post(`${this.urls.apiUrl}/ranks/${control.value}`, {}).pipe(map((response) => (response ? { rankTaken: true } : null)));
            })
        );
    }
}
