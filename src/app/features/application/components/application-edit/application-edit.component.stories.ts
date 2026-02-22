import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

const meta: Meta = {
    title: 'Application/Edit',
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
    .application-container { display: flex; flex-direction: row; margin-top: 10px; }
    .application-container .large-input { display: block; max-width: 50%; }
    .application-container .mat-mdc-card:first-child { flex-basis: 40%; margin-right: 10px; }
    .application-container .mat-mdc-card:first-child.no-margin-right { margin-right: 0; }
    .application-container .mat-mdc-card { flex: 1; }
    .special-field-form-container { display: none; }
    mat-checkbox { margin-top: 0; }
    .military-checkbox { display: block; margin-bottom: 12px; }
    h4 { color: #fec400; }
    a { color: #fec400; }
    .comment-placeholder { padding: 20px; text-align: center; color: #888; border: 1px dashed #555; border-radius: 4px; }
    @media screen and (max-width: 800px) {
        .application-container { flex-direction: column; }
        .application-container .mat-mdc-card:first-child { flex-basis: unset; margin-right: 0; margin-bottom: 10px; }
    }`
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

const validation_messages = {
    armaExperience: [{ type: 'required', message: 'Details about your Arma experience are required' }],
    unitsExperience: [{ type: 'required', message: 'Details about your past Arma unit experience is required' }],
    background: [{ type: 'required', message: 'Some background info about yourself is required' }]
};

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

export const Waiting: Story = {
    render: () => ({
        props: {
            formGroup: buildForm({
                armaExperience: 'Over 2000 hours in Arma 3.',
                unitsExperience: 'Previously in 3 Commando Brigade.',
                background: 'I am 25 years old from London.',
                reference: 'Steam',
                rolePreferences: ['Aviation']
            }),
            referenceElements$: new BehaviorSubject(referenceElements),
            rolePreferenceOptions,
            validation_messages,
            applicationState: 'Application Submitted',
            name: 'Cdt.Miller.B',
            pending: false,
            changesMade: false
        },
        styles,
        template: `
            <mat-card>
                <h2>{{ applicationState }}</h2>
                <p>Your application has been successfully submitted. Please wait for your SR1 recruitment officer to contact you.</p>
                <p>They will take you through some information and answer any questions you have. Your SR1 is your point of contact during the application process.</p>
                <p>You may edit certain parts of the application below, as well as communicate directly with your SR1 Recruitment Officer</p>
                <h3>Please read the following information</h3>
                <h4>Next steps</h4>
                <p>We require all applicants to play a candidate op with us to complete the process. This is an opportunity for you to see what kind of missions we play and how we play them, as well as the kind of people you will be playing with. Please note that some ops we do are not representative of the missions we play normally. Your SR1 will inform you if this is the case.</p>
                <h4>TeamSpeak</h4>
                <p>Feel free to join our TeamSpeak <a href="#">(uk-sf.co.uk)</a> at any time</p>
                <p>Members with a red <span style="color: red">R</span> tag are SR1 Recruitment Officers and are available should you have any questions.</p>
                <p>The 'General Discussion Lobby' is a public lobby that you may join at any time.</p>
                <p>'Private Discussion' lobbies are private, thus you should ask the people inside if you may join them before joining.</p>
                <h4>Game Setup</h4>
                <p>You should visit the <a href="#">Modpack Setup Guide</a> whilst you wait for your SR1 to contact you.</p>
                <p>Your Arma profile name and your TeamSpeak name both need to be changed to <b>{{ name }}</b></p>
            </mat-card>
            <div class="application-container">
                <mat-card>
                    <h3>Edit Application</h3>
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
                            <app-button [disabled]="!formGroup.valid || !changesMade" [pending]="pending">Update</app-button>
                        </div>
                    </form>
                </mat-card>
                <mat-card>
                    <h3>Application Chat</h3>
                    <div class="comment-placeholder">Comment thread (requires SignalR)</div>
                </mat-card>
            </div>
        `
    })
};

export const Accepted: Story = {
    render: () => ({
        props: { applicationState: 'Application Accepted' },
        styles,
        template: `
            <mat-card>
                <h2>{{ applicationState }}</h2>
                <p>Congratulations! Your application to join UKSF was accepted.</p>
                <p>Your next steps will be detailed to you by either an SR1, or a member of SFSG.</p>
            </mat-card>
        `
    })
};

export const Rejected: Story = {
    render: () => ({
        props: { applicationState: 'Application Rejected' },
        styles,
        template: `
            <mat-card>
                <h2>{{ applicationState }}</h2>
                <p>We are sorry but your application to join UKSF has been rejected</p>
                <p>Thank you for your interest in our unit. We hope you find a suitable alternative.</p>
            </mat-card>
            <div class="application-container">
                <mat-card class="no-margin-right">
                    <h3>Application Chat</h3>
                    <div class="comment-placeholder">Comment thread (requires SignalR)</div>
                </mat-card>
            </div>
        `
    })
};
