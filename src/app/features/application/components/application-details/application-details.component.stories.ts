import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

const meta: Meta = {
    title: 'Application/Details',
    decorators: [
        moduleMetadata({
            imports: [ReactiveFormsModule, MatCardModule, MatCheckboxModule]
        })
    ]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.mat-mdc-card { h2 { margin-top: 0; } }
    .button-next { text-align: right; }
    .large-input { display: block; max-width: 50%; }
    .special-field-form-container { display: none; }
    mat-checkbox { margin-top: 0; }
    .military-checkbox { display: block; margin-bottom: 12px; }
    h4 { color: #fec400; }`
];

const referenceElements: IDropdownElement[] = [
    { value: 'Recruiter', displayValue: 'Recruiter' },
    { value: 'Steam', displayValue: 'Steam' },
    { value: 'Reddit', displayValue: 'Reddit' },
    { value: 'YouTube', displayValue: 'YouTube' },
    { value: 'Instagram', displayValue: 'Instagram' },
    { value: 'Google', displayValue: 'Google' },
    { value: 'Arma 3 Discord', displayValue: 'Arma 3 Discord' },
    { value: 'Friend', displayValue: 'Friend' },
    { value: 'Other', displayValue: 'Other' }
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
                <app-text-input class="large-input" label="How much experience do you have playing Arma?"
                    formControlName="armaExperience" [multiline]="true" [maxRows]="5" [maxlength]="500" [required]="true"
                    [validationMessages]="validation_messages.armaExperience"
                    [hint]="formGroup.get('armaExperience').value?.length > 200 ? formGroup.get('armaExperience').value.length + ' / 500' : ''">
                </app-text-input>
                <app-text-input class="large-input" label="Other Units - have you ever been in an Arma unit? Which?"
                    formControlName="unitsExperience" [multiline]="true" [maxRows]="4" [maxlength]="250" [required]="true"
                    [validationMessages]="validation_messages.unitsExperience"
                    [hint]="formGroup.get('unitsExperience').value?.length > 200 ? formGroup.get('unitsExperience').value.length + ' / 250' : ''">
                </app-text-input>
                <app-text-input class="large-input" label="Personal background - tell us a little about yourself"
                    formControlName="background" [multiline]="true" [maxRows]="10" [maxlength]="500" [required]="true"
                    [validationMessages]="validation_messages.background"
                    [hint]="formGroup.get('background').value?.length > 400 ? formGroup.get('background').value.length + ' / 500' : ''">
                </app-text-input>
            </div>
            <mat-checkbox class="military-checkbox" color="primary" formControlName="militaryExperience">Are you or have you ever been a member of the military?</mat-checkbox>
            <div formGroupName="rolePreferences">
                <p>These options exist to give us an idea of what kind of role you are interested in. There is no guarantee you will be admitted to any of these programmes.</p>
                <div *ngFor="let rolePreferenceOption of rolePreferenceOptions">
                    <mat-checkbox color="primary" formControlName="{{ rolePreferenceOption }}">{{ rolePreferenceOption }}</mat-checkbox>
                </div>
            </div>
            <app-dropdown class="large-input" placeholder="Where did you hear about UKSF?" [autocomplete]="false"
                [elements]="referenceElements$" formControlName="reference" elementName="reference"
                [reserveErrorSpace]="false">
                <ng-template #element let-element>{{ element.displayValue }}</ng-template>
            </app-dropdown>
            <div class="button-next">
                <app-button [disabled]="!formGroup.valid">Submit</app-button>
            </div>
        </form>
    </mat-card>
`;

export const Empty: Story = {
    render: () => ({
        props: {
            formGroup: buildForm(),
            referenceElements$: new BehaviorSubject(referenceElements),
            rolePreferenceOptions,
            validation_messages
        },
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
            referenceElements$: new BehaviorSubject(referenceElements),
            rolePreferenceOptions,
            validation_messages
        },
        styles,
        template
    })
};
