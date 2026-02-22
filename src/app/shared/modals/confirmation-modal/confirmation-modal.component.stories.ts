import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';

const meta: Meta = {
    title: 'Modals/Confirmation',
    decorators: [moduleMetadata({ imports: [MatDialogModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.modal-content { min-width: 300px; font-size: 18px; } .modal-content span { white-space: pre-wrap; }`];

export const Default: Story = {
    render: () => ({
        styles,
        template: `
            <h2 mat-dialog-title>Confirm</h2>
            <mat-dialog-content>
                <span class="modal-content">Are you sure you want to proceed?</span>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="warn">Cancel</button>
                <app-flex-filler></app-flex-filler>
                <button mat-raised-button color="primary">Confirm</button>
            </mat-dialog-actions>
        `
    })
};

export const CustomTitle: Story = {
    render: () => ({
        styles,
        template: `
            <h2 mat-dialog-title>Delete Account</h2>
            <mat-dialog-content>
                <span class="modal-content">This action cannot be undone. All data associated with this account will be permanently deleted.</span>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="warn">Cancel</button>
                <app-flex-filler></app-flex-filler>
                <button mat-raised-button color="primary">Delete</button>
            </mat-dialog-actions>
        `
    })
};

export const HtmlContent: Story = {
    render: () => ({
        styles,
        template: `
            <h2 mat-dialog-title>Confirm Action</h2>
            <mat-dialog-content>
                <span class="modal-content" [innerHTML]="'Are you sure you want to <strong>remove</strong> this member from the unit?'"></span>
            </mat-dialog-content>
            <mat-dialog-actions>
                <button mat-raised-button color="warn">Cancel</button>
                <app-flex-filler></app-flex-filler>
                <button mat-raised-button color="primary">Confirm</button>
            </mat-dialog-actions>
        `
    })
};
