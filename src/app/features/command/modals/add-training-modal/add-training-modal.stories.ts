import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';

const meta: Meta = {
    title: 'Modals/AddTraining',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, MatDialogModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.modal-form { display: flex; flex-direction: column; width: fit-content; }
    .normal { display: block; width: 400px; }`];

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('', Validators.required),
            shortName: new FormControl(''),
            teamspeakGroup: new FormControl('')
        });
        return {
            props: {
                form,
                validationMessages: {
                    name: [{ type: 'required', message: 'Training name is required' }],
                    shortName: [],
                    teamspeakGroup: []
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Add Training</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="modal-form">
                        <app-text-input class="normal" label="Training Name" formControlName="name" [required]="true"
                            [validationMessages]="validationMessages.name">
                        </app-text-input>
                        <app-text-input class="normal" label="Short Name" formControlName="shortName"
                            [validationMessages]="validationMessages.shortName">
                        </app-text-input>
                        <app-text-input class="normal" label="TeamSpeak Group ID" formControlName="teamspeakGroup"
                            [validationMessages]="validationMessages.teamspeakGroup">
                        </app-text-input>
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
            name: new FormControl('Advanced Marksmanship', Validators.required),
            shortName: new FormControl('AM'),
            teamspeakGroup: new FormControl('142')
        });
        return {
            props: {
                form,
                validationMessages: {
                    name: [{ type: 'required', message: 'Training name is required' }],
                    shortName: [],
                    teamspeakGroup: []
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Add Training</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="modal-form">
                        <app-text-input class="normal" label="Training Name" formControlName="name" [required]="true"
                            [validationMessages]="validationMessages.name">
                        </app-text-input>
                        <app-text-input class="normal" label="Short Name" formControlName="shortName"
                            [validationMessages]="validationMessages.shortName">
                        </app-text-input>
                        <app-text-input class="normal" label="TeamSpeak Group ID" formControlName="teamspeakGroup"
                            [validationMessages]="validationMessages.teamspeakGroup">
                        </app-text-input>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <app-button [disabled]="!form.valid">Submit</app-button>
                </mat-dialog-actions>
            `
        };
    }
};
