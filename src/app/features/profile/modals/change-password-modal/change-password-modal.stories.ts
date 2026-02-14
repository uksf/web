import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

const meta: Meta = {
    title: 'Modals/ChangePassword',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.full-width { display: block; width: 100%; min-width: 300px; }`];

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            password: new FormControl('', Validators.required),
            confirmPass: new FormControl('', Validators.required)
        });
        return {
            props: { form },
            styles,
            template: `
                <h2 mat-dialog-title>Change Password</h2>
                <mat-dialog-content>
                    <form [formGroup]="form">
                        <app-text-input class="full-width" label="New Password" type="password"
                            formControlName="password" [required]="true">
                        </app-text-input>
                        <app-text-input class="full-width" label="Confirm New Password" type="password"
                            formControlName="confirmPass" [required]="true">
                        </app-text-input>
                        <sub>You will be logged out after changing your password</sub>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="primary" type="button" [disabled]="!form.valid">Submit</button>
                </mat-dialog-actions>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({
            password: new FormControl('secretpass123', Validators.required),
            confirmPass: new FormControl('secretpass123', Validators.required)
        });
        return {
            props: { form },
            styles,
            template: `
                <h2 mat-dialog-title>Change Password</h2>
                <mat-dialog-content>
                    <form [formGroup]="form">
                        <app-text-input class="full-width" label="New Password" type="password"
                            formControlName="password" [required]="true">
                        </app-text-input>
                        <app-text-input class="full-width" label="Confirm New Password" type="password"
                            formControlName="confirmPass" [required]="true">
                        </app-text-input>
                        <sub>You will be logged out after changing your password</sub>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <button mat-raised-button color="primary" type="button" [disabled]="!form.valid">Submit</button>
                </mat-dialog-actions>
            `
        };
    }
};
