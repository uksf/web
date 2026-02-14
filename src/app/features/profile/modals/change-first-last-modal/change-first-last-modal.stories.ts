import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

const meta: Meta = {
    title: 'Modals/ChangeFirstLast',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.names-container { display: flex; flex-direction: row; align-items: center; margin-bottom: 15px; }
    .names-container .name { display: block; width: 100%; }
    .names-container .name:first-of-type { margin-right: 5px; }`];

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            firstName: new FormControl('', Validators.required),
            lastName: new FormControl('', Validators.required)
        });
        return {
            props: { form, displayName: '' },
            styles,
            template: `
                <h2 mat-dialog-title>Change Name</h2>
                <mat-dialog-content>
                    <form [formGroup]="form">
                        <div class="names-container">
                            <app-text-input class="name" formControlName="firstName" [required]="true" [reserveErrorSpace]="false">
                            </app-text-input>
                            <app-text-input class="name" formControlName="lastName" [required]="true" [reserveErrorSpace]="false">
                            </app-text-input>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <span>Your new name will be <b>{{ displayName }}</b></span>
                    <app-flex-filler></app-flex-filler>
                    <button mat-raised-button color="primary" type="button" [disabled]="!form.valid">Submit</button>
                </mat-dialog-actions>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({
            firstName: new FormControl('John', Validators.required),
            lastName: new FormControl('Smith', Validators.required)
        });
        return {
            props: { form, displayName: 'J.Smith' },
            styles,
            template: `
                <h2 mat-dialog-title>Change Name</h2>
                <mat-dialog-content>
                    <form [formGroup]="form">
                        <div class="names-container">
                            <app-text-input class="name" formControlName="firstName" [required]="true" [reserveErrorSpace]="false">
                            </app-text-input>
                            <app-text-input class="name" formControlName="lastName" [required]="true" [reserveErrorSpace]="false">
                            </app-text-input>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <span>Your new name will be <b>{{ displayName }}</b></span>
                    <app-flex-filler></app-flex-filler>
                    <button mat-raised-button color="primary" type="button" [disabled]="!form.valid">Submit</button>
                </mat-dialog-actions>
            `
        };
    }
};
