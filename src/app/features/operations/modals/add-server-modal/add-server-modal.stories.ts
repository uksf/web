import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

const meta: Meta = {
    title: 'Modals/AddServer',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule] })]
};
export default meta;
type Story = StoryObj;

const environments = [
    { value: 0, viewValue: 'Release' },
    { value: 1, viewValue: 'RC' },
    { value: 2, viewValue: 'Development' }
];

const serverOptions = [
    { value: 0, viewValue: 'Server Only' },
    { value: 1, viewValue: 'Server + 1 HC' },
    { value: 2, viewValue: 'Server + 2 HC' }
];

const validationMessages = {
    name: [{ type: 'required', message: 'Server name is required' }],
    port: [{ type: 'required', message: 'Port is required' }],
    apiPort: [{ type: 'required', message: 'API port is required' }],
    numberHeadlessClients: [],
    profileName: [{ type: 'required', message: 'Profile name is required' }],
    hostName: [{ type: 'required', message: 'Display name is required' }],
    password: [{ type: 'required', message: 'Password is required' }],
    adminPassword: [{ type: 'required', message: 'Admin password is required' }],
    environment: [{ type: 'required', message: 'Environment is required' }],
    serverOption: [{ type: 'required', message: 'Server option is required' }]
};

const styles = [`.overflow-container { display: flex; flex-direction: column; overflow-y: auto; }
    .normal { display: block; width: 400px; }`];

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('', Validators.required),
            port: new FormControl('', Validators.required),
            apiPort: new FormControl('', Validators.required),
            numberHeadlessClients: new FormControl(0),
            profileName: new FormControl('', Validators.required),
            hostName: new FormControl('', Validators.required),
            password: new FormControl('', Validators.required),
            adminPassword: new FormControl('', Validators.required),
            environment: new FormControl('', Validators.required),
            serverOption: new FormControl('', Validators.required)
        });
        return {
            props: { form, environments, serverOptions, validationMessages },
            styles,
            template: `
                <h2 mat-dialog-title>Add Server</h2>
                <mat-dialog-content>
                    <form [formGroup]="form">
                        <div class="overflow-container">
                            <app-text-input class="normal" label="Server Name" formControlName="name" [required]="true"
                                [validationMessages]="validationMessages.name"></app-text-input>
                            <app-text-input class="normal" label="Port" formControlName="port" [required]="true" type="number"
                                [validationMessages]="validationMessages.port"></app-text-input>
                            <app-text-input class="normal" label="Api Port" formControlName="apiPort" [required]="true" type="number"
                                [validationMessages]="validationMessages.apiPort"></app-text-input>
                            <app-text-input class="normal" label="Headless clients required" formControlName="numberHeadlessClients" type="number"
                                [validationMessages]="validationMessages.numberHeadlessClients"></app-text-input>
                            <app-text-input class="normal" label="Server Profile Name" formControlName="profileName" [required]="true"
                                [validationMessages]="validationMessages.profileName"></app-text-input>
                            <app-text-input class="normal" label="Server Display Name" formControlName="hostName" [required]="true"
                                [validationMessages]="validationMessages.hostName"></app-text-input>
                            <app-text-input class="normal" label="Server Password" formControlName="password" [required]="true"
                                [validationMessages]="validationMessages.password"></app-text-input>
                            <app-text-input class="normal" label="Admin Password" formControlName="adminPassword" [required]="true"
                                [validationMessages]="validationMessages.adminPassword"></app-text-input>
                            <mat-form-field class="normal">
                                <mat-label>Environment</mat-label>
                                <mat-select formControlName="environment" required>
                                    <mat-option *ngFor="let option of environments" [value]="option.value">{{ option.viewValue }}</mat-option>
                                </mat-select>
                            </mat-form-field>
                            <mat-form-field class="normal">
                                <mat-label>Server options</mat-label>
                                <mat-select formControlName="serverOption" required>
                                    <mat-option *ngFor="let option of serverOptions" [value]="option.value">{{ option.viewValue }}</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <app-button [disabled]="!form.valid">Submit</app-button>
                </mat-dialog-actions>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('Server 1', Validators.required),
            port: new FormControl(2302, Validators.required),
            apiPort: new FormControl(2303, Validators.required),
            numberHeadlessClients: new FormControl(2),
            profileName: new FormControl('server1', Validators.required),
            hostName: new FormControl('UKSF Server 1', Validators.required),
            password: new FormControl('password123', Validators.required),
            adminPassword: new FormControl('admin123', Validators.required),
            environment: new FormControl(0, Validators.required),
            serverOption: new FormControl(1, Validators.required)
        });
        return {
            props: { form, environments, serverOptions, validationMessages },
            styles,
            template: `
                <h2 mat-dialog-title>Add Server</h2>
                <mat-dialog-content>
                    <form [formGroup]="form">
                        <div class="overflow-container">
                            <app-text-input class="normal" label="Server Name" formControlName="name" [required]="true"
                                [validationMessages]="validationMessages.name"></app-text-input>
                            <app-text-input class="normal" label="Port" formControlName="port" [required]="true" type="number"
                                [validationMessages]="validationMessages.port"></app-text-input>
                            <app-text-input class="normal" label="Api Port" formControlName="apiPort" [required]="true" type="number"
                                [validationMessages]="validationMessages.apiPort"></app-text-input>
                            <app-text-input class="normal" label="Headless clients required" formControlName="numberHeadlessClients" type="number"
                                [validationMessages]="validationMessages.numberHeadlessClients"></app-text-input>
                            <app-text-input class="normal" label="Server Profile Name" formControlName="profileName" [required]="true"
                                [validationMessages]="validationMessages.profileName"></app-text-input>
                            <app-text-input class="normal" label="Server Display Name" formControlName="hostName" [required]="true"
                                [validationMessages]="validationMessages.hostName"></app-text-input>
                            <app-text-input class="normal" label="Server Password" formControlName="password" [required]="true"
                                [validationMessages]="validationMessages.password"></app-text-input>
                            <app-text-input class="normal" label="Admin Password" formControlName="adminPassword" [required]="true"
                                [validationMessages]="validationMessages.adminPassword"></app-text-input>
                            <mat-form-field class="normal">
                                <mat-label>Environment</mat-label>
                                <mat-select formControlName="environment" required>
                                    <mat-option *ngFor="let option of environments" [value]="option.value">{{ option.viewValue }}</mat-option>
                                </mat-select>
                            </mat-form-field>
                            <mat-form-field class="normal">
                                <mat-label>Server options</mat-label>
                                <mat-select formControlName="serverOption" required>
                                    <mat-option *ngFor="let option of serverOptions" [value]="option.value">{{ option.viewValue }}</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <app-button [disabled]="!form.valid">Submit</app-button>
                </mat-dialog-actions>
            `
        };
    }
};
