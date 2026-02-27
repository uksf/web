import { Component, Inject, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { getValidationError } from '@app/shared/services/form-helper.service';
import { Observable, of, Subject, timer } from 'rxjs';
import { first, map, switchMap, takeUntil } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GameServersService } from '../../services/game-servers.service';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

@Component({
    selector: 'app-add-server-modal',
    templateUrl: './add-server-modal.component.html',
    styleUrls: ['./add-server-modal.component.scss'],
    standalone: false
})
export class AddServerModalComponent implements OnDestroy {
    private destroy$ = new Subject<void>();
    environmentElements: IDropdownElement[] = [
        { value: '0', displayValue: 'Release' },
        { value: '1', displayValue: 'Rc' },
        { value: '2', displayValue: 'Dev' },
    ];
    serverOptionElements: IDropdownElement[] = [
        { value: '0', displayValue: 'None' },
        { value: '1', displayValue: 'Run alone' },
        { value: '2', displayValue: 'DCG' },
    ];
    environmentElements$ = of(this.environmentElements);
    serverOptionElements$ = of(this.serverOptionElements);
    form = this.formBuilder.group({
        name: ['', Validators.required, this.validateServer.bind(this)],
        port: ['', Validators.required],
        apiPort: ['', Validators.required, this.validateServer.bind(this)],
        numberHeadlessClients: [0, Validators.required],
        profileName: ['', Validators.required],
        hostName: ['', Validators.required],
        password: ['', Validators.required],
        adminPassword: ['', Validators.required],
        environment: new FormControl<IDropdownElement | null>(null, Validators.required),
        serverOption: new FormControl<IDropdownElement | null>(null, Validators.required),
    });
    getValidationError = getValidationError;
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
            this.form.patchValue({
                name: this.server.name,
                port: this.server.port,
                apiPort: this.server.apiPort,
                numberHeadlessClients: this.server.numberHeadlessClients,
                profileName: this.server.profileName,
                hostName: this.server.hostName,
                password: this.server.password,
                adminPassword: this.server.adminPassword,
            });
            this.form.controls.environment.setValue(this.environmentElements.find(e => e.value === String(this.server.environment)));
            this.form.controls.serverOption.setValue(this.serverOptionElements.find(e => e.value === String(this.server.serverOption)));
            Object.keys(this.form.controls).forEach((key) => {
                this.form.get(key).valueChanges.pipe(takeUntil(this.destroy$)).subscribe({
                    next: (change) => {
                        const compareValue = key === 'environment' || key === 'serverOption'
                            ? Number((change as IDropdownElement)?.value)
                            : change;
                        if (compareValue !== this.server[key]) {
                            this.changes.add(key);
                        } else {
                            this.changes.delete(key);
                        }
                    }
                });
            });
        } else {
            this.form.controls.environment.setValue(this.environmentElements[0]);
            this.form.controls.serverOption.setValue(this.serverOptionElements[0]);
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
            this.server.environment = Number(this.form.controls.environment.value?.value);
            this.server.serverOption = Number(this.form.controls.serverOption.value?.value);
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
            const payload = this.getFormRawValues();
            this.gameServersService.addServer(JSON.stringify(payload), this.connectionId)
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

    private getFormRawValues() {
        const raw = this.form.getRawValue();
        return {
            ...raw,
            environment: Number(this.form.controls.environment.value?.value ?? 0),
            serverOption: Number(this.form.controls.serverOption.value?.value ?? 0),
        };
    }
}

interface AddServerModalData {
    server?: Record<string, unknown>;
    connectionId?: string;
}
