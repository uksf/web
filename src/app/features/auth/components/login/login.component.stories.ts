import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

const meta: Meta = {
    title: 'Auth/Login',
    decorators: [
        moduleMetadata({
            imports: [FormsModule, MatCardModule, MatCheckboxModule]
        })
    ]
};
export default meta;
type Story = StoryObj;

const styles = [
    `h2 { margin: auto 0 8px; }
    .container { width: 90%; max-width: 500px; margin: 10px; padding: 15px; }
    .options-container { display: flex; flex-direction: row; }
    .options-container .option-link { display: block; margin: auto; line-height: 24px; cursor: pointer; }
    .button-container { display: flex; flex-direction: row; justify-content: center; }
    .full-width { display: block; width: 100%; }
    .invalid-message { text-align: center; width: 100%; color: #f44336; }
    .special-field-form-container { display: none; }`
];

const validationMessages = {
    email: [
        { type: 'required', message: 'Email address is required' },
        { type: 'email', message: 'Email address is invalid' }
    ],
    password: [{ type: 'required', message: 'Password is required' }]
};

export const Empty: Story = {
    render: () => ({
        props: {
            model: { name: null, email: null, password: null },
            stayLogged: true,
            loginError: '',
            pending: false,
            validationMessages
        },
        styles,
        template: `
            <mat-card class="container">
                <div>
                    <h2 mat-dialog-title>Login</h2>
                    <form>
                        <app-text-input class="full-width" label="Email Address" type="email"
                            name="formEmail" [(ngModel)]="model.email" autocomplete="username"
                            [required]="true" email
                            [validationMessages]="validationMessages.email">
                        </app-text-input>
                        <br />
                        <app-text-input class="full-width" label="Password" type="password"
                            name="formPassword" [(ngModel)]="model.password" autocomplete="current-password"
                            [required]="true"
                            [validationMessages]="validationMessages.password">
                        </app-text-input>
                    </form>
                    <div class="options-container">
                        <mat-checkbox color="primary" [(ngModel)]="stayLogged">Stay logged in</mat-checkbox>
                        <app-flex-filler></app-flex-filler>
                        <a class="option-link">Reset Password</a>
                    </div>
                    <br />
                    <div class="button-container">
                        <app-button [pending]="pending">Login</app-button>
                    </div>
                </div>
            </mat-card>
        `
    })
};

export const Filled: Story = {
    render: () => ({
        props: {
            model: { name: null, email: 'user@example.com', password: 'mypassword' },
            stayLogged: true,
            loginError: '',
            pending: false,
            validationMessages
        },
        styles,
        template: `
            <mat-card class="container">
                <div>
                    <h2 mat-dialog-title>Login</h2>
                    <form>
                        <app-text-input class="full-width" label="Email Address" type="email"
                            name="formEmail" [(ngModel)]="model.email" autocomplete="username"
                            [required]="true" email
                            [validationMessages]="validationMessages.email">
                        </app-text-input>
                        <br />
                        <app-text-input class="full-width" label="Password" type="password"
                            name="formPassword" [(ngModel)]="model.password" autocomplete="current-password"
                            [required]="true"
                            [validationMessages]="validationMessages.password">
                        </app-text-input>
                    </form>
                    <div class="options-container">
                        <mat-checkbox color="primary" [(ngModel)]="stayLogged">Stay logged in</mat-checkbox>
                        <app-flex-filler></app-flex-filler>
                        <a class="option-link">Reset Password</a>
                    </div>
                    <br />
                    <div class="button-container">
                        <app-button [pending]="pending">Login</app-button>
                    </div>
                </div>
            </mat-card>
        `
    })
};

export const Error: Story = {
    render: () => ({
        props: {
            model: { name: null, email: 'user@example.com', password: 'wrongpassword' },
            stayLogged: true,
            loginError: 'Invalid email or password',
            pending: false,
            validationMessages
        },
        styles,
        template: `
            <mat-card class="container">
                <div>
                    <h2 mat-dialog-title>Login</h2>
                    <form>
                        <app-text-input class="full-width" label="Email Address" type="email"
                            name="formEmail" [(ngModel)]="model.email" autocomplete="username"
                            [required]="true" email
                            [validationMessages]="validationMessages.email">
                        </app-text-input>
                        <br />
                        <app-text-input class="full-width" label="Password" type="password"
                            name="formPassword" [(ngModel)]="model.password" autocomplete="current-password"
                            [required]="true"
                            [validationMessages]="validationMessages.password">
                        </app-text-input>
                    </form>
                    <div class="options-container">
                        <mat-checkbox color="primary" [(ngModel)]="stayLogged">Stay logged in</mat-checkbox>
                        <app-flex-filler></app-flex-filler>
                        <a class="option-link">Reset Password</a>
                    </div>
                    <div *ngIf="loginError != ''">
                        <br />
                        <div class="invalid-message">
                            <span>{{ loginError }}</span>
                        </div>
                    </div>
                    <br />
                    <div class="button-container">
                        <app-button [pending]="pending">Login</app-button>
                    </div>
                </div>
            </mat-card>
        `
    })
};

export const Pending: Story = {
    render: () => ({
        props: {
            model: { name: null, email: 'user@example.com', password: 'mypassword' },
            stayLogged: true,
            loginError: '',
            pending: true,
            validationMessages
        },
        styles,
        template: `
            <mat-card class="container">
                <div>
                    <h2 mat-dialog-title>Login</h2>
                    <form>
                        <app-text-input class="full-width" label="Email Address" type="email"
                            name="formEmail" [(ngModel)]="model.email" autocomplete="username"
                            [required]="true" email
                            [validationMessages]="validationMessages.email">
                        </app-text-input>
                        <br />
                        <app-text-input class="full-width" label="Password" type="password"
                            name="formPassword" [(ngModel)]="model.password" autocomplete="current-password"
                            [required]="true"
                            [validationMessages]="validationMessages.password">
                        </app-text-input>
                    </form>
                    <div class="options-container">
                        <mat-checkbox color="primary" [(ngModel)]="stayLogged">Stay logged in</mat-checkbox>
                        <app-flex-filler></app-flex-filler>
                        <a class="option-link">Reset Password</a>
                    </div>
                    <br />
                    <div class="button-container">
                        <app-button [disabled]="true" [pending]="pending">Login</app-button>
                    </div>
                </div>
            </mat-card>
        `
    })
};
