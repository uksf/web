import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

const meta: Meta = {
    title: 'Modals/NewModpackBuild',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule, MatButtonModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.modal-form { display: flex; flex-direction: column; width: 100%; }
    .container .normal { display: block; width: 100%; }
    .force-container { display: flex; flex-direction: column; }
    .hint-text { color: rgba(255,255,255,0.7); font-size: 14px; }`];

const configurations = ['Release', 'RC', 'Development'];
const branches = ['main', 'develop', 'feature/new-weapons', 'bugfix/vehicle-damage'];

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            configuration: new FormControl('Release'),
            referenceGroup: new FormGroup({
                branch: new FormControl(''),
                commitId: new FormControl('')
            }),
            ace: new FormControl(false),
            acre: new FormControl(false),
            air: new FormControl(false)
        });
        return {
            props: {
                form,
                configurations,
                branches,
                validationMessages: { commitId: [] }
            },
            styles,
            template: `
                <h2 mat-dialog-title>New Build</h2>
                <mat-dialog-content>
                    <p class="hint-text">Select a branch or enter a commit id to run a new build from</p>
                    <form [formGroup]="form" class="modal-form">
                        <mat-form-field class="normal">
                            <mat-label>Configuration</mat-label>
                            <mat-select formControlName="configuration">
                                <mat-option *ngFor="let config of configurations" [value]="config">{{ config }}</mat-option>
                            </mat-select>
                        </mat-form-field>
                        <div formGroupName="referenceGroup">
                            <mat-form-field class="normal">
                                <mat-label>Select branch</mat-label>
                                <mat-select formControlName="branch">
                                    <mat-option *ngFor="let branch of branches" [value]="branch">{{ branch }}</mat-option>
                                </mat-select>
                            </mat-form-field>
                            <app-text-input class="normal" label="Commit ID" formControlName="commitId"
                                [validationMessages]="validationMessages.commitId">
                            </app-text-input>
                        </div>
                        <div class="force-container">
                            <mat-checkbox color="primary" formControlName="ace">Force ACE build</mat-checkbox>
                            <mat-checkbox color="primary" formControlName="acre">Force ACRE build</mat-checkbox>
                            <mat-checkbox color="primary" formControlName="air">Force Air build</mat-checkbox>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="primary" type="button">Run</button>
                </mat-dialog-actions>
            `
        };
    }
};

export const BranchSelected: Story = {
    render: () => {
        const form = new FormGroup({
            configuration: new FormControl('Release'),
            referenceGroup: new FormGroup({
                branch: new FormControl('main'),
                commitId: new FormControl('')
            }),
            ace: new FormControl(false),
            acre: new FormControl(false),
            air: new FormControl(false)
        });
        return {
            props: {
                form,
                configurations,
                branches,
                validationMessages: { commitId: [] }
            },
            styles,
            template: `
                <h2 mat-dialog-title>New Build</h2>
                <mat-dialog-content>
                    <p class="hint-text">Select a branch or enter a commit id to run a new build from</p>
                    <form [formGroup]="form" class="modal-form">
                        <mat-form-field class="normal">
                            <mat-label>Configuration</mat-label>
                            <mat-select formControlName="configuration">
                                <mat-option *ngFor="let config of configurations" [value]="config">{{ config }}</mat-option>
                            </mat-select>
                        </mat-form-field>
                        <div formGroupName="referenceGroup">
                            <mat-form-field class="normal">
                                <mat-label>Select branch</mat-label>
                                <mat-select formControlName="branch">
                                    <mat-option *ngFor="let branch of branches" [value]="branch">{{ branch }}</mat-option>
                                </mat-select>
                            </mat-form-field>
                            <app-text-input class="normal" label="Commit ID" formControlName="commitId"
                                [validationMessages]="validationMessages.commitId">
                            </app-text-input>
                        </div>
                        <div class="force-container">
                            <mat-checkbox color="primary" formControlName="ace">Force ACE build</mat-checkbox>
                            <mat-checkbox color="primary" formControlName="acre">Force ACRE build</mat-checkbox>
                            <mat-checkbox color="primary" formControlName="air">Force Air build</mat-checkbox>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="primary" type="button">Run</button>
                </mat-dialog-actions>
            `
        };
    }
};
