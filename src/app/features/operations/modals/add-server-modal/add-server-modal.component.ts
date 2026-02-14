import { Component, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { getValidationError } from '@app/shared/services/form-helper.service';
import { Observable, of, Subject, timer } from 'rxjs';
import { first, map, switchMap, takeUntil } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GameServersService } from '../../services/game-servers.service';

@Component({
    selector: 'app-add-server-modal',
    templateUrl: './add-server-modal.component.html',
    styleUrls: ['./add-server-modal.component.scss']
})
export class AddServerModalComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    form = this.formBuilder.group({
        name: ['', Validators.required, this.validateServer.bind(this)],
        port: ['', Validators.required],
        apiPort: ['', Validators.required, this.validateServer.bind(this)],
        numberHeadlessClients: [0, Validators.required],
        profileName: ['', Validators.required],
        hostName: ['', Validators.required],
        password: ['', Validators.required],
        adminPassword: ['', Validators.required],
        environment: [0, Validators.required],
        serverOption: [0, Validators.required],
    });
    getValidationError = getValidationError;
    environments = [
        { value: 0, viewValue: 'Release' },
        { value: 1, viewValue: 'Rc' },
        { value: 2, viewValue: 'Dev' },
    ];
    serverOptions = [
        { value: 0, viewValue: 'None' },
        { value: 1, viewValue: 'Run alone' },
        { value: 2, viewValue: 'DCG' },
    ];
    validationMessages = {
        name: [
            { type: 'required', message: 'Name is required' },
            { type: 'serverTaken', message: 'That name is already in use' },
        ],
        apiPort: [
            { type: 'required', message: 'Api Port is required' },
            { type: 'serverTaken', message: 'That api port is already in use' },
        ],
        port: [{ type: 'required', message: 'Port is required' }],
        numberHeadlessClients: [{ type: 'required', message: 'Headless client count is required' }],
        profileName: [{ type: 'required', message: 'Profile name is required' }],
        hostName: [{ type: 'required', message: 'Server display name is required' }],
        password: [{ type: 'required', message: 'Server password is required' }],
        adminPassword: [{ type: 'required', message: 'Admin password is required' }],
        environment: [{ type: 'required', message: 'Environment is required' }],
        serverOption: [{ type: 'required', message: 'Server option is required' }],
    };
    edit = false;
    changes = new Set<string>();
    server;
    submitting = false;
    private connectionId: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private dialog: MatDialog,
        private dialogRef: MatDialogRef<AddServerModalComponent>,
        private gameServersService: GameServersService,
        @Inject(MAT_DIALOG_DATA) public data: AddServerModalData
    ) {
        if (data) {
            this.edit = true;
            this.server = data.server;
            this.connectionId = data.connectionId;
            this.form.patchValue(this.server);
            Object.keys(this.form.controls).forEach((key) => {
                this.form.get(key).valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
                    next: (change) => {
                        if (change !== this.server[key]) {
                            this.changes.add(key);
                        } else {
                            this.changes.delete(key);
                        }
                    }
                });
            });
        } else {
            this.changes.add('dummy');
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    submit() {
        this.submitting = true;
        if (this.edit) {
            this.server.name = this.form.controls.name.value;
            this.server.port = this.form.controls.port.value;
            this.server.apiPort = this.form.controls.apiPort.value;
            this.server.numberHeadlessClients = this.form.controls.numberHeadlessClients.value;
            this.server.profileName = this.form.controls.profileName.value;
            this.server.hostName = this.form.controls.hostName.value;
            this.server.password = this.form.controls.password.value;
            this.server.adminPassword = this.form.controls.adminPassword.value;
            this.server.environment = this.form.controls.environment.value;
            this.server.serverOption = this.form.controls.serverOption.value;
            this.gameServersService.editServer(this.server, this.connectionId)
                .pipe(first())
                .subscribe({
                    next: (environmentChanged: boolean) => {
                        this.dialogRef.close(environmentChanged);
                    },
                    error: () => {
                        this.submitting = false;
                    },
                });
        } else {
            this.gameServersService.addServer(JSON.stringify(this.form.getRawValue()), this.connectionId)
                .pipe(first())
                .subscribe({
                    next: () => {
                        this.dialogRef.close(false);
                    },
                    error: () => {
                        this.submitting = false;
                    }
                });
        }
    }

    private validateServer(control: AbstractControl): Observable<ValidationErrors> {
        return timer(200).pipe(
            switchMap(() => {
                if (control.pristine || control.value === null) {
                    return of(null);
                }
                const body = this.edit ? this.server : {};
                return this.gameServersService.checkServerExists(control.value, body, this.connectionId)
                    .pipe(map((response) => (response ? { serverTaken: true } : null)));
            })
        );
    }
}

interface AddServerModalData {
    server?: Record<string, unknown>;
    connectionId?: string;
}
