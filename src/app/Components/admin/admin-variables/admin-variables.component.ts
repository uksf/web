import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material';
import { Observable, timer, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-admin-variables',
    templateUrl: './admin-variables.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.css', './admin-variables.component.css']
})
export class AdminVariablesComponent implements OnInit {
    form: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    updating;
    variables;

    validationMessages = {
        'key': [
            { type: 'required', message: 'Key is required' },
            { type: 'keyTaken', message: 'That key is already in use' }
        ], 'item': [
            { type: 'required', message: 'Item is required' }
        ]
    };

    constructor(formbuilder: FormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {
        this.form = formbuilder.group({
            key: ['', Validators.required, this.validateVariable.bind(this)],
            item: ['', Validators.required]
        })
    }

    ngOnInit() {
        this.getVariables();
    }

    validateVariable(control: AbstractControl): Observable<ValidationErrors> {
        return timer(200).pipe(
            switchMap(() => {
                if (control.pristine || !control.value) { return of(null); }
                return this.httpClient.post(`${this.urls.apiUrl}/variables/${control.value}`, {}).pipe(
                    map(response => (response ? { keyTaken: true } : null))
                );
            })
        );
    }

    validateInlineVariable(variable): Observable<boolean> {
        return timer(200).pipe(
            switchMap(() => {
                return this.httpClient.post(`${this.urls.apiUrl}/variables`, variable, {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                }).pipe(
                    map(response => (response ? true : false))
                );
            })
        );
    }

    getVariables() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/variables`).subscribe(response => {
            this.variables = response;
            this.updating = false;
        }, _ => {
            this.updating = false;
        });
    }

    addVariable() {
        this.updating = true;
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.put(`${this.urls.apiUrl}/variables`, formString, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => {
            this.form.controls.key.reset();
            this.form.controls.item.reset();
            this.getVariables();
        });
    }

    editVariable(variable) {
        if (variable) {
            this.updating = true;
            this.httpClient.patch(`${this.urls.apiUrl}/variables`, variable, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            }).subscribe(response => {
                this.variables = response;
                this.updating = false;
            }, _ => {
                this.updating = false;
            });
        }
    }

    deleteVariable(event, variable) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${variable.key}'? This action could break functionality` }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.updating = true;
            this.httpClient.delete(`${this.urls.apiUrl}/variables/${variable.key}`).subscribe(response => {
                this.variables = response;
                this.updating = false;
            }, _ => {
                this.updating = false;
            });
        });
    }
}
