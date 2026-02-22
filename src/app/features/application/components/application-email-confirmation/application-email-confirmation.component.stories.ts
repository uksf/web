import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

const meta: Meta = {
    title: 'Application/EmailConfirmation',
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
    .normal { display: block; max-width: 50%; }`
];

const template = `
    <mat-card>
        <h2>Email Confirmation</h2>
        <form [formGroup]="formGroup">
            <p>
                An email has been sent to <b>'{{ email }}'</b> containing a confirmation code. Please copy this code to your clipboard and return to this page to confirm the code.
            </p>
            <p>If the code does not work or you did not receive a code, press 'Resend Code' (This will invalidate the previous code)</p>
            <br />
            <app-text-input class="normal" label="Enter confirmation code" formControlName="code" [required]="true"
                autocomplete="off">
            </app-text-input>
            <div class="button-next">
                <app-button [disabled]="pending || resent" [pending]="pending">Resend Code</app-button>
            </div>
        </form>
    </mat-card>
`;

export const Default: Story = {
    render: () => ({
        props: {
            formGroup: new FormGroup({ code: new FormControl('', Validators.required) }),
            email: 'applicant@example.com',
            pending: false,
            resent: false
        },
        styles,
        template
    })
};

export const CodeEntered: Story = {
    render: () => ({
        props: {
            formGroup: new FormGroup({ code: new FormControl('ABC123DEF456GHI789JKL012', Validators.required) }),
            email: 'applicant@example.com',
            pending: false,
            resent: false
        },
        styles,
        template
    })
};
