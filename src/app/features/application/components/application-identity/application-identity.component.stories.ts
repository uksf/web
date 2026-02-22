import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

const meta: Meta = {
    title: 'Application/Identity',
    decorators: [
        moduleMetadata({
            imports: [ReactiveFormsModule, MatCardModule]
        })
    ]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.mat-mdc-card { h2 { margin-top: 0; } }
    .button-next { text-align: right; }
    .special-field-form-container { display: none; }
    .normal { display: block; max-width: 50%; }
    .name-container { display: flex; flex-direction: column; }
    .names-container { display: flex; flex-direction: row; align-items: center; }
    .names-container .name { display: block; width: 100%; }
    .names-container .name:first-of-type { margin-right: 5px; }
    .display-name { visibility: hidden; display: block; }
    .display-name.visible { visibility: visible; }
    .dob { display: inline-block; width: 75px; min-width: 0; margin-right: 5px; }
    .dob-error { font-size: 11px; line-height: 16px; color: var(--mdc-theme-error, #f44336); }
    .button-container { display: flex; flex-direction: row; }
    h4 { color: #fec400; }`
];

const digitsOnly = /^[0-9]$/;

const validation_messages = {
    email: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Enter a valid email' },
        { type: 'emailTaken', message: 'That email has already been taken' }
    ],
    password: [
        { type: 'required', message: 'Password is required' },
        { type: 'minlength', message: 'Password must be 12 characters or more' }
    ],
    confirmPassword: [{ type: 'mismatchedPasswords', message: 'Passwords must match' }],
    firstName: [{ type: 'required', message: 'First name is required' }],
    lastName: [{ type: 'required', message: 'Last name is required' }],
    dob: [
        { type: 'required', message: 'Date of Birth is required' },
        { type: 'nan', message: 'Invalid date: Not a number' }
    ]
};

function buildForm(values: Record<string, unknown> = {}) {
    const fb = new UntypedFormBuilder();
    return fb.group({
        name: ['', Validators.maxLength(0)],
        email: [(values['email'] as string) || '', [Validators.required, Validators.email]],
        passwordGroup: fb.group({
            password: [(values['password'] as string) || '', [Validators.required, Validators.minLength(12)]],
            confirmPassword: [(values['confirmPassword'] as string) || '']
        }),
        firstName: [(values['firstName'] as string) || '', Validators.required],
        lastName: [(values['lastName'] as string) || '', Validators.required],
        dobGroup: fb.group({
            day: [(values['day'] as string) || '', Validators.required],
            month: [(values['month'] as string) || '', Validators.required],
            year: [(values['year'] as string) || '', Validators.required]
        }),
        nation: [(values['nation'] as string) || '']
    });
}

const template = `
    <mat-card>
        <h2>Identity</h2>
        <form [formGroup]="formGroup">
            <app-text-input class="normal" label="Email" formControlName="email" [required]="true" autocomplete="username"
                [validationMessages]="validation_messages.email">
            </app-text-input>
            <div formGroupName="passwordGroup">
                <app-text-input class="normal" label="Password (min 12 chars)" formControlName="password" type="password" [required]="true"
                    autocomplete="new-password" [validationMessages]="validation_messages.password">
                </app-text-input>
                <app-text-input class="normal" label="Confirm Password" formControlName="confirmPassword" type="password"
                    autocomplete="new-password" [validationMessages]="validation_messages.confirmPassword">
                </app-text-input>
            </div>
            <div class="name-container">
                <p>This name will be used in-game, on TeamSpeak, and on Discord.</p>
                <p>If you do not wish to use your real name, you may use a realistic fake name (for example, Barry Miller)</p>
                <div class="names-container">
                    <app-text-input class="name" label="First name" formControlName="firstName" [required]="true"
                        autocomplete="given-name" [validationMessages]="validation_messages.firstName">
                    </app-text-input>
                    <app-text-input class="name" label="Last name" formControlName="lastName" [required]="true"
                        autocomplete="family-name" [validationMessages]="validation_messages.lastName">
                    </app-text-input>
                </div>
                <span class="display-name" [class.visible]="formGroup.value.firstName && formGroup.value.lastName">
                    Your name will be displayed as:
                    <b>Cdt.{{ formGroup.value.lastName }}.{{ formGroup.value.firstName[0] }}</b>
                </span>
            </div>
            <div formGroupName="dobGroup">
                <p>Date of Birth</p>
                <p>For example: 15/02/1989</p>
                <app-text-input class="dob" placeholder="dd" inputmode="numeric" formControlName="day" [required]="true"
                    [reserveErrorSpace]="false" [keypressFilter]="digitsOnly">
                </app-text-input>/
                <app-text-input class="dob" placeholder="mm" inputmode="numeric" formControlName="month" [required]="true"
                    [reserveErrorSpace]="false" [keypressFilter]="digitsOnly">
                </app-text-input>/
                <app-text-input class="dob" placeholder="yyyy" inputmode="numeric" formControlName="year" [required]="true"
                    [reserveErrorSpace]="false" [keypressFilter]="digitsOnly">
                </app-text-input>
            </div>
            <p><i>Nation of Residence dropdown omitted in story (requires CountryPickerService)</i></p>
            <div class="button-next button-container">
                <app-button [disabled]="pending">Previous</app-button>
                <app-flex-filler></app-flex-filler>
                <app-button [disabled]="!formGroup.valid || pending" [pending]="pending">Next</app-button>
            </div>
        </form>
    </mat-card>
`;

export const Empty: Story = {
    render: () => ({
        props: { formGroup: buildForm(), validation_messages, digitsOnly, pending: false },
        styles,
        template
    })
};

export const Filled: Story = {
    render: () => ({
        props: {
            formGroup: buildForm({
                email: 'applicant@example.com',
                password: 'securepassword123',
                confirmPassword: 'securepassword123',
                firstName: 'Barry',
                lastName: 'Miller',
                day: '15',
                month: '02',
                year: '1989'
            }),
            validation_messages,
            digitsOnly,
            pending: false
        },
        styles,
        template
    })
};

export const PasswordMismatch: Story = {
    render: () => ({
        props: {
            formGroup: buildForm({
                email: 'applicant@example.com',
                password: 'securepassword123',
                confirmPassword: 'differentpassword',
                firstName: 'Barry',
                lastName: 'Miller'
            }),
            validation_messages,
            digitsOnly,
            pending: false
        },
        styles,
        template
    })
};
