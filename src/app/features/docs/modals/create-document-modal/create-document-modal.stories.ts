import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';

const meta: Meta = {
    title: 'Modals/CreateDocument',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, FormsModule, MatDialogModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.form-container { flex: 1; }
    .form-container app-text-input { display: block; }
    .basics-container { display: flex; flex-direction: column; gap: 8px; }
    .hint { font-style: italic; }`];

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('', Validators.required)
        });
        return {
            props: {
                form,
                validationMessages: {
                    name: [{ type: 'required', message: 'Document name is required' }]
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Create new document</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="form-container">
                        <div class="basics-container">
                            <app-text-input label="Document name" formControlName="name" [required]="true"
                                [validationMessages]="validationMessages.name">
                            </app-text-input>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <app-button [disabled]="!form.valid">Create</app-button>
                </mat-dialog-actions>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('Patrol Base Procedures', Validators.required)
        });
        return {
            props: {
                form,
                validationMessages: {
                    name: [{ type: 'required', message: 'Document name is required' }]
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Create new document</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="form-container">
                        <div class="basics-container">
                            <app-text-input label="Document name" formControlName="name" [required]="true"
                                [validationMessages]="validationMessages.name">
                            </app-text-input>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <app-button [disabled]="!form.valid">Create</app-button>
                </mat-dialog-actions>
            `
        };
    }
};

export const EditMode: Story = {
    render: () => {
        const form = new FormGroup({
            name: new FormControl('Patrol Base Procedures', Validators.required)
        });
        return {
            props: {
                form,
                validationMessages: {
                    name: [{ type: 'required', message: 'Document name is required' }]
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Edit document</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="form-container">
                        <div class="basics-container">
                            <app-text-input label="Document name" formControlName="name" [required]="true"
                                [validationMessages]="validationMessages.name">
                            </app-text-input>
                        </div>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <app-button [disabled]="!form.valid">Create</app-button>
                </mat-dialog-actions>
            `
        };
    }
};
