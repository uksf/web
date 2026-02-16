import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

const meta: Meta = {
    title: 'Application/Edit',
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
    .application-container { display: flex; flex-direction: row; margin-top: 10px; }
    .application-container .large-input { width: 100%; margin-bottom: 10px; }
    .application-container .mat-mdc-card:first-child { flex-basis: 40%; margin-right: 10px; }
    .application-container .mat-mdc-card:first-child.no-margin-right { margin-right: 0; }
    .application-container .mat-mdc-card { flex: 1; }
    .mat-mdc-form-field { width: 100%; max-width: 300px; }
    .mat-mdc-form-field.large-input { max-width: 750px; }
    .special-field-form-container { display: none; }
    h4 { color: #7b1fa2; }
    a { color: #7b1fa2; }
    .comment-placeholder { padding: 20px; text-align: center; color: #888; border: 1px dashed #555; border-radius: 4px; }
    @media screen and (max-width: 800px) {
        .application-container { flex-direction: column; }
        .application-container .mat-mdc-card:first-child { flex-basis: unset; margin-right: 0; margin-bottom: 10px; }
    }`
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
            referenceOptions,
            rolePreferenceOptions,
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
                <br />
                <h3>Please read the following information</h3>
                <h4>Next steps</h4>
                <p>We require all applicants to play a candidate op with us to complete the process. This is an opportunity for you to see what kind of missions we play and how we play them, as well as the kind of people you will be playing with. Please note that some ops we do are not representative of the missions we play normally. Your SR1 will inform you if this is the case.</p>
                <br />
                <h4>TeamSpeak</h4>
                <p>Feel free to join our TeamSpeak <a href="#">(uk-sf.co.uk)</a> at any time</p>
                <p>Members with a red <span style="color: red">R</span> tag are SR1 Recruitment Officers and are available should you have any questions.</p>
                <p>The 'General Discussion Lobby' is a public lobby that you may join at any time.</p>
                <p>'Private Discussion' lobbies are private, thus you should ask the people inside if you may join them before joining.</p>
                <br />
                <h4>Game Setup</h4>
                <p>You should visit the <a href="#">Modpack Setup Guide</a> whilst you wait for your SR1 to contact you.</p>
                <p>Your Arma profile name and your TeamSpeak name both need to be changed to <b>{{ name }}</b></p>
            </mat-card>
            <div class="application-container">
                <mat-card>
                    <h3>Edit Application</h3>
                    <form [formGroup]="formGroup">
                        <div>
                            <mat-form-field class="large-input">
                                <mat-label>How much experience do you have playing Arma?</mat-label>
                                <textarea matInput matTextareaAutosize matAutosizeMinRows="2" matAutosizeMaxRows="5" formControlName="armaExperience" maxlength="500"></textarea>
                            </mat-form-field>
                            <br />
                            <mat-form-field class="large-input">
                                <mat-label>Other Units - have you ever been in an Arma unit? Which?</mat-label>
                                <textarea matInput matTextareaAutosize matAutosizeMinRows="2" matAutosizeMaxRows="4" formControlName="unitsExperience" maxlength="250"></textarea>
                            </mat-form-field>
                            <br />
                            <mat-form-field class="large-input">
                                <mat-label>Personal background - tell us a little about yourself</mat-label>
                                <textarea matInput matTextareaAutosize matAutosizeMinRows="5" matAutosizeMaxRows="10" formControlName="background" maxlength="500"></textarea>
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
                            <mat-label>Where did you hear about UKSF?</mat-label>
                            <mat-select formControlName="reference">
                                <mat-option *ngFor="let referenceOption of referenceOptions" [value]="referenceOption.value">
                                    {{ referenceOption.viewValue }}
                                </mat-option>
                            </mat-select>
                        </mat-form-field>
                        <br />
                        <br />
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
