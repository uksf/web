import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

const meta: Meta = {
    title: 'Modals/AddUnit',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, MatDialogModule, MatCheckboxModule, MatFormFieldModule, MatSelectModule] })]
};
export default meta;
type Story = StoryObj;

const branchTypes = [
    { value: 0, viewValue: 'Combat' },
    { value: 1, viewValue: 'Auxiliary' }
];

const parentUnits = [
    { id: '1', name: 'UKSF' },
    { id: '2', name: '1 Squadron' },
    { id: '3', name: '2 Squadron' }
];

const styles = [`.modal-form { display: flex; flex-direction: column; width: fit-content; }
    .normal { display: block; width: 400px; }
    .button-delete { color: red !important; }`];

const validationMessages = {
    name: [{ type: 'required', message: 'Unit name is required' }],
    shortname: [{ type: 'required', message: 'Short name is required' }],
    parent: [{ type: 'required', message: 'Parent unit is required' }],
    teamspeakGroup: [],
    discordRoleId: [],
    callsign: []
};

const unitTemplate = (title: string, showDelete: boolean) => `
    <h2 mat-dialog-title>${title}</h2>
    <mat-dialog-content>
        <form [formGroup]="form" class="modal-form">
            <app-text-input class="normal" label="Unit Name" formControlName="name" [required]="true"
                [validationMessages]="validationMessages.name">
            </app-text-input>
            <app-text-input class="normal" label="Short Name" formControlName="shortname" [required]="true"
                [validationMessages]="validationMessages.shortname">
            </app-text-input>
            <mat-checkbox color="primary" formControlName="preferShortname">Prefer displaying short name</mat-checkbox>
            <mat-form-field class="normal">
                <mat-label>Branch Type</mat-label>
                <mat-select formControlName="branch" required>
                    <mat-option *ngFor="let type of branchTypes" [value]="type.value">{{ type.viewValue }}</mat-option>
                </mat-select>
            </mat-form-field>
            <mat-form-field class="normal">
                <mat-label>Parent Unit</mat-label>
                <mat-select formControlName="parent" required>
                    <mat-option *ngFor="let unit of parentUnits" [value]="unit.id">{{ unit.name }}</mat-option>
                </mat-select>
            </mat-form-field>
            <app-text-input class="normal" label="TeamSpeak Group ID" formControlName="teamspeakGroup" type="number"
                [validationMessages]="validationMessages.teamspeakGroup">
            </app-text-input>
            <app-text-input class="normal" label="Discord Role ID" formControlName="discordRoleId"
                [validationMessages]="validationMessages.discordRoleId">
            </app-text-input>
            <app-text-input class="normal" label="Callsign" formControlName="callsign"
                [validationMessages]="validationMessages.callsign">
            </app-text-input>
            <app-text-input class="normal" label="Unit Icon" formControlName="icon">
            </app-text-input>
        </form>
    </mat-dialog-content>
    <mat-dialog-actions>
        ${showDelete ? '<button mat-raised-button type="button" class="button-delete">Delete</button><app-flex-filler></app-flex-filler>' : ''}
        <app-button [disabled]="!form.valid">Submit</app-button>
    </mat-dialog-actions>
`;

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('', Validators.required),
            shortname: new FormControl('', Validators.required),
            preferShortname: new FormControl(false),
            branch: new FormControl('', Validators.required),
            parent: new FormControl('', Validators.required),
            teamspeakGroup: new FormControl(''),
            discordRoleId: new FormControl(''),
            callsign: new FormControl(''),
            icon: new FormControl('')
        });
        return {
            props: { form, branchTypes, parentUnits, validationMessages },
            styles,
            template: unitTemplate('Add Unit', false)
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('1 Troop', Validators.required),
            shortname: new FormControl('1T', Validators.required),
            preferShortname: new FormControl(false),
            branch: new FormControl(0, Validators.required),
            parent: new FormControl('2', Validators.required),
            teamspeakGroup: new FormControl('210'),
            discordRoleId: new FormControl('987654321098765432'),
            callsign: new FormControl('Alpha'),
            icon: new FormControl('troop-icon.paa')
        });
        return {
            props: { form, branchTypes, parentUnits, validationMessages },
            styles,
            template: unitTemplate('Add Unit', false)
        };
    }
};

export const EditMode: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('1 Troop', Validators.required),
            shortname: new FormControl('1T', Validators.required),
            preferShortname: new FormControl(false),
            branch: new FormControl(0, Validators.required),
            parent: new FormControl('2', Validators.required),
            teamspeakGroup: new FormControl('210'),
            discordRoleId: new FormControl('987654321098765432'),
            callsign: new FormControl('Alpha'),
            icon: new FormControl('troop-icon.paa')
        });
        return {
            props: { form, branchTypes, parentUnits, validationMessages },
            styles,
            template: unitTemplate('Edit Unit', true)
        };
    }
};
