import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

const meta: Meta = {
    title: 'Modals/InstallWorkshopMod',
    decorators: [moduleMetadata({ imports: [ReactiveFormsModule, MatDialogModule, MatCheckboxModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [`.form-container { display: flex; flex-direction: column; width: 100%; min-width: 700px; }
    .form-container .normal { display: block; width: 100%; }
    .root-mod { display: flex; margin: 8px 0 0; }`];

export const Default: Story = {
    render: () => {
        const form = new FormGroup({
            steamId: new FormControl('', Validators.required),
            rootMod: new FormControl(false),
            folderName: new FormControl('')
        });
        return {
            props: {
                form,
                validationMessages: {
                    steamId: [{ type: 'required', message: 'Steam ID or Workshop link is required' }]
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Install Workshop Mod</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="form-container">
                        <app-text-input class="normal" label="Steam ID or Workshop Link" formControlName="steamId"
                            [validationMessages]="validationMessages.steamId">
                        </app-text-input>
                        <div class="root-mod">
                            <mat-checkbox color="primary" formControlName="rootMod">Install as root mod</mat-checkbox>
                        </div>
                        <app-text-input class="normal" label="Custom root folder name (optional, e.g. @CBA_A3)" formControlName="folderName"
                            hint="Leave blank to use the mod name with @ prefix">
                        </app-text-input>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <app-button [disabled]="!form.valid">Install</app-button>
                </mat-dialog-actions>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({
            steamId: new FormControl('https://steamcommunity.com/sharedfiles/filedetails/?id=463939057', Validators.required),
            rootMod: new FormControl(true),
            folderName: new FormControl('@ace')
        });
        return {
            props: {
                form,
                validationMessages: {
                    steamId: [{ type: 'required', message: 'Steam ID or Workshop link is required' }]
                }
            },
            styles,
            template: `
                <h2 mat-dialog-title>Install Workshop Mod</h2>
                <mat-dialog-content>
                    <form [formGroup]="form" class="form-container">
                        <app-text-input class="normal" label="Steam ID or Workshop Link" formControlName="steamId"
                            [validationMessages]="validationMessages.steamId">
                        </app-text-input>
                        <div class="root-mod">
                            <mat-checkbox color="primary" formControlName="rootMod">Install as root mod</mat-checkbox>
                        </div>
                        <app-text-input class="normal" label="Custom root folder name (optional, e.g. @CBA_A3)" formControlName="folderName"
                            hint="Leave blank to use the mod name with @ prefix">
                        </app-text-input>
                    </form>
                </mat-dialog-content>
                <mat-dialog-actions>
                    <app-button [disabled]="!form.valid">Install</app-button>
                </mat-dialog-actions>
            `
        };
    }
};
