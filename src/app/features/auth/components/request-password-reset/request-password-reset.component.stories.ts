import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

const meta: Meta = {
    title: 'Auth/RequestPasswordReset',
    decorators: [
        moduleMetadata({
            imports: [FormsModule, MatCardModule]
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
    .special-field-form-container { display: none; }`
];

const validationMessages = {
    email: [
        { type: 'required', message: 'Email address is required' },
        { type: 'email', message: 'Email address is invalid' }
    ]
};

export const Default: Story = {
    render: () => ({
        props: {
            model: { name: null, email: null },
            pending: false,
            sent: false,
            validationMessages
        },
        styles,
        template: `
            <mat-card class="container">
                <div>
                    <h2 mat-dialog-title>Request Password Reset</h2>
                    <form>
                        <app-text-input class="full-width" label="Email Address" type="email"
                            name="formEmail" [(ngModel)]="model.email" autocomplete="username"
                            [required]="true" email
                            [validationMessages]="validationMessages.email">
                        </app-text-input>
                    </form>
                    <div class="options-container">
                        <app-flex-filler></app-flex-filler>
                        <a class="option-link">Return to Login</a>
                    </div>
                    <br />
                    <div class="button-container">
                        <app-button [pending]="pending">Request Reset</app-button>
                    </div>
                </div>
            </mat-card>
        `
    })
};

export const Sent: Story = {
    render: () => ({
        styles,
        template: `
            <mat-card class="container">
                <div>
                    <h2 mat-dialog-title>Password Reset Requested</h2>
                    <span>If an associated account exists, an email with a link to reset your password will be sent shortly</span>
                    <br />
                    <br />
                    <div class="options-container">
                        <app-flex-filler></app-flex-filler>
                        <a class="option-link">Return to Login</a>
                    </div>
                </div>
            </mat-card>
        `
    })
};
