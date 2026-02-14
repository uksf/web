import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';

const meta: Meta = {
    title: 'Modals/AddRank',
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
            abbreviation: new FormControl('', Validators.required),
            teamspeakGroup: new FormControl(''),
            discordRoleId: new FormControl('')
        });
        return {
            props: {
                form,
                validationMessages: {
                    name: [{ type: 'required', message: 'Rank name is required' }],
                    abbreviation: [{ type: 'required', message: 'Abbreviation is required' }],
                    teamspeakGroup: [],
                    discordRoleId: []
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Add Rank</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="modal-form">
                        <app-text-input class="normal" label="Rank Name" formControlName="name" [required]="true"
                            [validationMessages]="validationMessages.name">
                        </app-text-input>
                        <app-text-input class="normal" label="Abbreviation" formControlName="abbreviation" [required]="true"
                            [validationMessages]="validationMessages.abbreviation">
                        </app-text-input>
                        <app-text-input class="normal" label="TeamSpeak Group ID" formControlName="teamspeakGroup"
                            [validationMessages]="validationMessages.teamspeakGroup">
                        </app-text-input>
                        <app-text-input class="normal" label="Discord Role ID" formControlName="discordRoleId">
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
            name: new FormControl('Sergeant', Validators.required),
            abbreviation: new FormControl('Sgt', Validators.required),
            teamspeakGroup: new FormControl('105'),
            discordRoleId: new FormControl('123456789012345678')
        });
        return {
            props: {
                form,
                validationMessages: {
                    name: [{ type: 'required', message: 'Rank name is required' }],
                    abbreviation: [{ type: 'required', message: 'Abbreviation is required' }],
                    teamspeakGroup: [],
                    discordRoleId: []
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Add Rank</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="modal-form">
                        <app-text-input class="normal" label="Rank Name" formControlName="name" [required]="true"
                            [validationMessages]="validationMessages.name">
                        </app-text-input>
                        <app-text-input class="normal" label="Abbreviation" formControlName="abbreviation" [required]="true"
                            [validationMessages]="validationMessages.abbreviation">
                        </app-text-input>
                        <app-text-input class="normal" label="TeamSpeak Group ID" formControlName="teamspeakGroup"
                            [validationMessages]="validationMessages.teamspeakGroup">
                        </app-text-input>
                        <app-text-input class="normal" label="Discord Role ID" formControlName="discordRoleId">
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
