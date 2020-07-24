import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';
import { Observable, of, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-add-server-modal',
    templateUrl: './add-server-modal.component.html',
    styleUrls: ['./add-server-modal.component.css']
})
export class AddServerModalComponent {
    form: FormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    serverEnvironments = [
        { value: 0, viewValue: 'Release' },
        { value: 1, viewValue: 'Rc' },
        { value: 2, viewValue: 'Dev' }
    ];
    serverOptions = [
        { value: 0, viewValue: 'None' },
        { value: 1, viewValue: 'Run alone' },
        { value: 2, viewValue: 'DCG' }
    ];
    validationMessages = {
        'name': [
            { type: 'required', message: 'Name is required' },
            { type: 'serverTaken', message: 'That name is already in use' }
        ], 'apiPort': [
            { type: 'required', message: 'Api Port is required' },
            { type: 'serverTaken', message: 'That api port is already in use' }
        ], 'port': [
            { type: 'required', message: 'Port is required' }
        ], 'numberHeadlessClients': [
            { type: 'required', message: 'Headless client count is required' }
        ], 'profileName': [
            { type: 'required', message: 'Profile name is required' }
        ], 'hostName': [
            { type: 'required', message: 'Server display name is required' }
        ], 'password': [
            { type: 'required', message: 'Server password is required' }
        ], 'adminPassword': [
            { type: 'required', message: 'Admin password is required' }
        ], 'serverEnvironment': [
            { type: 'required', message: 'Environment is required' }
        ], 'serverOption': [
            { type: 'required', message: 'Server option is required' }
        ]
    };
    edit = false;
    changes = new Set<string>();
    server;
    submitting = false;

    constructor(formbuilder: FormBuilder, private dialog: MatDialog, private dialogRef: MatDialogRef<AddServerModalComponent>, private httpClient: HttpClient, private urls: UrlService, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.form = formbuilder.group({
            name: ['', Validators.required, this.validateServer.bind(this)],
            port: ['', Validators.required],
            apiPort: ['', Validators.required, this.validateServer.bind(this)],
            numberHeadlessClients: [0, Validators.required],
            profileName: ['', Validators.required],
            hostName: ['', Validators.required],
            password: ['', Validators.required],
            adminPassword: ['', Validators.required],
            serverEnvironment: [0, Validators.required],
            serverOption: [0, Validators.required]
        });
        if (data) {
            this.edit = true;
            this.server = data.server;
            this.form.patchValue(this.server);
            Object.keys(this.form.controls).forEach(key => {
                this.form.get(key).valueChanges.subscribe(change => {
                    if (change !== this.server[key]) {
                        this.changes.add(key);
                    } else {
                        this.changes.delete(key);
                    }
                });
            });
        } else {
            this.changes.add('dummy');
        }
    }

    private validateServer(control: AbstractControl): Observable<ValidationErrors> {
        if (this.edit) {
            return timer(200).pipe(
                switchMap(() => {
                    if (control.pristine || control.value === null) { return of(null); }
                    return this.httpClient.post(`${this.urls.apiUrl}/gameservers/${control.value}`, this.server).pipe(
                        map(response => (response ? { serverTaken: true } : null))
                    );
                })
            );
        } else {
            return timer(200).pipe(
                switchMap(() => {
                    if (control.pristine || control.value === null) { return of(null); }
                    return this.httpClient.post(`${this.urls.apiUrl}/gameservers/${control.value}`, {}).pipe(
                        map(response => (response ? { serverTaken: true } : null))
                    );
                })
            );
        }
    }

    submit() {
        this.submitting = true;
        if (this.edit) {
            this.server.name = this.form.controls['name'].value;
            this.server.port = this.form.controls['port'].value;
            this.server.apiPort = this.form.controls['apiPort'].value;
            this.server.numberHeadlessClients = this.form.controls['numberHeadlessClients'].value;
            this.server.profileName = this.form.controls['profileName'].value;
            this.server.hostName = this.form.controls['hostName'].value;
            this.server.password = this.form.controls['password'].value;
            this.server.adminPassword = this.form.controls['adminPassword'].value;
            this.server.serverEnvironment = this.form.controls['serverEnvironment'].value;
            this.server.serverOption = this.form.controls['serverOption'].value;
            this.httpClient.patch(`${this.urls.apiUrl}/gameservers`, this.server, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            }).subscribe((environmentChanged: boolean) => {
                this.dialogRef.close(environmentChanged);
            }, _ => {
                this.submitting = false;
            });
        } else {
            this.httpClient.put(`${this.urls.apiUrl}/gameservers`, JSON.stringify(this.form.getRawValue()), {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            }).subscribe(_ => {
                this.dialogRef.close(false);
            }, _ => {
                this.submitting = false;
            });
        }
    }
}
