import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';

const meta: Meta = {
    title: 'Modals/RequestLOA',
    decorators: [
        moduleMetadata({
            imports: [
                CommonModule,
                ReactiveFormsModule,
                MatDialogModule,
                MatFormFieldModule,
                MatInputModule,
                MatDatepickerModule,
                MatNativeDateModule,
                MatCheckboxModule
            ]
        })
    ]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.gmt-note { margin: 0 0 10px; font-size: 12px; color: inherit; }
     .modal-form { width: 100%; min-width: 400px; display: flex; flex-direction: column; }
     .reason-field { width: 100%; }
     .modal-form .mat-mdc-form-field { width: 100%; }
     .modal-form .mat-mdc-form-field input { cursor: pointer; }
     .invalid-message { text-align: center; width: 100%; margin: 10px 0; }`
];

const validationMessages = {
    reason: [{ type: 'required', message: 'Reason is required' }]
};

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            reason: new FormControl('', Validators.required),
            start: new FormControl(null, Validators.required),
            end: new FormControl(null, Validators.required),
            emergency: new FormControl(false)
        });
        return {
            props: { form, validationMessages, late: false, invalidMessage: '' },
            styles,
            template: `
                <h2 mat-dialog-title>LOA Request</h2>
                <mat-dialog-content>
                    <p class="gmt-note">Dates should be considered as GMT</p>
                    <form [formGroup]="form" class="modal-form">
                        <app-text-input class="reason-field" label="Reason" [required]="true" formControlName="reason"
                            [validationMessages]="validationMessages.reason" [reserveErrorSpace]="true">
                        </app-text-input>
                        <mat-form-field>
                            <mat-label>Start date</mat-label>
                            <input matInput [matDatepicker]="pickerStart" formControlName="start" readonly />
                            <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
                            <mat-datepicker #pickerStart></mat-datepicker>
                        </mat-form-field>
                        <mat-form-field>
                            <mat-label>End date (inclusive)</mat-label>
                            <input matInput [matDatepicker]="pickerEnd" formControlName="end" readonly />
                            <mat-datepicker-toggle matSuffix [for]="pickerEnd"></mat-datepicker-toggle>
                            <mat-datepicker #pickerEnd></mat-datepicker>
                        </mat-form-field>
                        <div class="invalid-message" *ngIf="invalidMessage">
                            <span>{{ invalidMessage }}</span>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="primary" [disabled]="!form.valid">Submit</button>
                </mat-dialog-actions>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const form = new FormGroup({
            reason: new FormControl('Family holiday - will be away from computer.', Validators.required),
            start: new FormControl(today, Validators.required),
            end: new FormControl(nextWeek, Validators.required),
            emergency: new FormControl(false)
        });
        return {
            props: { form, validationMessages, late: false, invalidMessage: '' },
            styles,
            template: `
                <h2 mat-dialog-title>LOA Request</h2>
                <mat-dialog-content>
                    <p class="gmt-note">Dates should be considered as GMT</p>
                    <form [formGroup]="form" class="modal-form">
                        <app-text-input class="reason-field" label="Reason" [required]="true" formControlName="reason"
                            [validationMessages]="validationMessages.reason" [reserveErrorSpace]="true">
                        </app-text-input>
                        <mat-form-field>
                            <mat-label>Start date</mat-label>
                            <input matInput [matDatepicker]="pickerStart" formControlName="start" readonly />
                            <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
                            <mat-datepicker #pickerStart></mat-datepicker>
                        </mat-form-field>
                        <mat-form-field>
                            <mat-label>End date (inclusive)</mat-label>
                            <input matInput [matDatepicker]="pickerEnd" formControlName="end" readonly />
                            <mat-datepicker-toggle matSuffix [for]="pickerEnd"></mat-datepicker-toggle>
                            <mat-datepicker #pickerEnd></mat-datepicker>
                        </mat-form-field>
                        <div class="invalid-message" *ngIf="invalidMessage">
                            <span>{{ invalidMessage }}</span>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="primary" [disabled]="!form.valid">Submit</button>
                </mat-dialog-actions>
            `
        };
    }
};

export const LateEmergency: Story = {
    render: () => {
        const today = new Date();
        const form = new FormGroup({
            reason: new FormControl('Emergency leave required.', Validators.required),
            start: new FormControl(today, Validators.required),
            end: new FormControl(today, Validators.required),
            emergency: new FormControl(true)
        });
        return {
            props: { form, validationMessages, late: true, invalidMessage: '' },
            styles,
            template: `
                <h2 mat-dialog-title>LOA Request</h2>
                <mat-dialog-content>
                    <p class="gmt-note">Dates should be considered as GMT</p>
                    <form [formGroup]="form" class="modal-form">
                        <app-text-input class="reason-field" label="Reason" [required]="true" formControlName="reason"
                            [validationMessages]="validationMessages.reason" [reserveErrorSpace]="true">
                        </app-text-input>
                        <mat-form-field>
                            <mat-label>Start date</mat-label>
                            <input matInput [matDatepicker]="pickerStart" formControlName="start" readonly />
                            <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
                            <mat-datepicker #pickerStart></mat-datepicker>
                        </mat-form-field>
                        <mat-form-field>
                            <mat-label>End date (inclusive)</mat-label>
                            <input matInput [matDatepicker]="pickerEnd" formControlName="end" readonly />
                            <mat-datepicker-toggle matSuffix [for]="pickerEnd"></mat-datepicker-toggle>
                            <mat-datepicker #pickerEnd></mat-datepicker>
                        </mat-form-field>
                        <mat-checkbox color="primary" formControlName="emergency" *ngIf="late" matTooltip="If this is an emergency, tick this box">Emergency</mat-checkbox>
                        <div class="invalid-message" *ngIf="invalidMessage">
                            <span>{{ invalidMessage }}</span>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="primary" [disabled]="!form.valid">Submit</button>
                </mat-dialog-actions>
            `
        };
    }
};
