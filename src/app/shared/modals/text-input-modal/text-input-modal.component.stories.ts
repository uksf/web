import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

const meta: Meta = {
    title: 'Modals/TextInput',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.textarea-container { margin-top: 8px; } .textarea { font-size: 14px; flex: 1; width: 100%; }`];

export const Default: Story = {
    render: () => {
        const form = new FormGroup({ input: new FormControl('', Validators.required) });
        return {
            props: { form },
            styles,
            template: `
                <h2 mat-dialog-title>Input</h2>
                <mat-dialog-content>
                    <span>Please provide a reason for this action.</span>
                    <form [formGroup]="form" class="textarea-container">
                        <mat-form-field class="textarea">
                            <textarea matInput formControlName="input" required matTextareaAutosize matAutosizeMinRows="5" matAutosizeMaxRows="5" maxlength="200"></textarea>
                        </mat-form-field>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="warn">Cancel</button>
                    <app-flex-filler></app-flex-filler>
                    <button mat-raised-button color="primary" [disabled]="!form.valid">Confirm</button>
                </mat-dialog-actions>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({ input: new FormControl('This is a reason for the requested action.', Validators.required) });
        return {
            props: { form },
            styles,
            template: `
                <h2 mat-dialog-title>Rejection Reason</h2>
                <mat-dialog-content>
                    <span>Please explain why this application is being rejected.</span>
                    <form [formGroup]="form" class="textarea-container">
                        <mat-form-field class="textarea">
                            <textarea matInput formControlName="input" required matTextareaAutosize matAutosizeMinRows="5" matAutosizeMaxRows="5" maxlength="200"></textarea>
                        </mat-form-field>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="warn">Cancel</button>
                    <app-flex-filler></app-flex-filler>
                    <button mat-raised-button color="primary" [disabled]="!form.valid">Confirm</button>
                </mat-dialog-actions>
            `
        };
    }
};
