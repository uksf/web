import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

const meta: Meta = {
    title: 'Application/Details',
    decorators: [
        moduleMetadata({
            imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule]
        })
    ]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.mat-mdc-card { h2 { margin-top: 0; } }
    .button-next { text-align: right; }
    .large-input { margin-bottom: 10px; }
    mat-label { white-space: pre-line; }
    .mat-mdc-form-field { width: 100%; max-width: 300px; }
    .mat-mdc-form-field.large-input { max-width: 750px; }
    .special-field-form-container { display: none; }
    h4 { color: #7b1fa2; }`
];

const referenceOptions = [
    { value: 'Recruiter', viewValue: 'Recruiter' },
    { value: 'Steam', viewValue: 'Steam' },
    { value: 'Reddit', viewValue: 'Reddit' },
    { value: 'YouTube', viewValue: 'YouTube' },
    { value: 'Instagram', viewValue: 'Instagram' },
    { value: 'Google', viewValue: 'Google' },
    { value: 'Arma 3 Discord', viewValue: 'Arma 3 Discord' },
    { value: 'Friend', viewValue: 'Friend' },
    { value: 'Other', viewValue: 'Other' }
];

const rolePreferenceOptions = ['NCO', 'Officer', 'Aviation', 'Medic'];

function buildForm(values: Record<string, unknown> = {}) {
    const fb = new UntypedFormBuilder();
    const formGroup = fb.group({
        name: ['', Validators.maxLength(0)],
        armaExperience: [values['armaExperience'] || '', Validators.required],
        unitsExperience: [values['unitsExperience'] || '', Validators.required],
        background: [values['background'] || '', Validators.required],
        militaryExperience: [values['militaryExperience'] || false],
        reference: [values['reference'] || '', Validators.required]
    });
    const rolePreferenceControls: { [key: string]: UntypedFormControl } = {};
    rolePreferenceOptions.forEach((x) => {
        rolePreferenceControls[x] = new UntypedFormControl((values['rolePreferences'] as string[] || []).includes(x));
    });
    formGroup.addControl('rolePreferences', new UntypedFormGroup(rolePreferenceControls));
    return formGroup;
}

const validation_messages = {
    armaExperience: [{ type: 'required', message: 'Details about your Arma experience are required' }],
    unitsExperience: [{ type: 'required', message: 'Details about your past Arma unit experience is required' }],
    background: [{ type: 'required', message: 'Some background info about yourself is required' }]
};

const template = `
    <mat-card>
        <h2>Details</h2>
        <form [formGroup]="formGroup">
            <div>
                <mat-form-field class="large-input">
                    <textarea matInput matTextareaAutosize matAutosizeMinRows="2" matAutosizeMaxRows="5" formControlName="armaExperience" maxlength="500" #armaText></textarea>
                    <mat-label>How much experience do you have playing Arma?</mat-label>
                    <mat-hint *ngIf="armaText.value.length > 200">{{ armaText.value.length }} / 500</mat-hint>
                </mat-form-field>
                <br />
                <mat-form-field class="large-input">
                    <textarea matInput matTextareaAutosize matAutosizeMinRows="2" matAutosizeMaxRows="4" formControlName="unitsExperience" maxlength="250" #unitsText></textarea>
                    <mat-label>Other Units - have you ever been in an Arma unit? Which?</mat-label>
                    <mat-hint *ngIf="unitsText.value.length > 200">{{ unitsText.value.length }} / 250</mat-hint>
                </mat-form-field>
                <br />
                <mat-form-field class="large-input">
                    <textarea matInput matTextareaAutosize matAutosizeMinRows="5" matAutosizeMaxRows="10" formControlName="background" maxlength="500" #backgroundText></textarea>
                    <mat-label>Personal background - tell us a little about yourself</mat-label>
                    <mat-hint *ngIf="backgroundText.value.length > 400">{{ backgroundText.value.length }} / 500</mat-hint>
                </mat-form-field>
            </div>
            <mat-checkbox color="primary" formControlName="militaryExperience">Are you or have you ever been a member of the military?</mat-checkbox>
            <br />
            <br />
            <div formGroupName="rolePreferences">
                <p>These options exist to give us an idea of what kind of role you are interested in. There is no guarantee you will be admitted to any of these programmes.</p>
                <div *ngFor="let rolePreferenceOption of rolePreferenceOptions">
                    <mat-checkbox color="primary" formControlName="{{ rolePreferenceOption }}">{{ rolePreferenceOption }}</mat-checkbox>
                </div>
            </div>
            <br />
            <mat-form-field>
                <mat-select formControlName="reference">
                    <mat-option *ngFor="let referenceOption of referenceOptions" [value]="referenceOption.value">
                        {{ referenceOption.viewValue }}
                    </mat-option>
                </mat-select>
                <mat-label>Where did you hear about UKSF?</mat-label>
            </mat-form-field>
            <br />
            <div class="button-next">
                <app-button [disabled]="!formGroup.valid">Next</app-button>
            </div>
        </form>
    </mat-card>
`;

export const Empty: Story = {
    render: () => ({
        props: { formGroup: buildForm(), referenceOptions, rolePreferenceOptions, validation_messages },
        styles,
        template
    })
};

export const Filled: Story = {
    render: () => ({
        props: {
            formGroup: buildForm({
                armaExperience: 'Over 2000 hours in Arma 3, experienced with ACE, ACRE, and various modsets. Played since Alpha.',
                unitsExperience: 'Previously in 3 Commando Brigade for 6 months. Left due to schedule conflicts.',
                background: 'I am 25 years old from London. I work in IT and have been gaming for most of my life. Looking for a dedicated milsim community.',
                militaryExperience: false,
                reference: 'Steam',
                rolePreferences: ['Aviation', 'Medic']
            }),
            referenceOptions,
            rolePreferenceOptions,
            validation_messages
        },
        styles,
        template
    })
};
