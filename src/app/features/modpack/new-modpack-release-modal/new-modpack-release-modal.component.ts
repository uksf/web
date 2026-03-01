import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModpackRelease } from '../models/modpack-release';
import { ModpackReleaseService } from '../modpackRelease.service';
import { AutofocusStopComponent } from '../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { NgClass } from '@angular/common';
import { ButtonComponent } from '../../../shared/components/elements/button-pending/button.component';
import { ReactiveFormValueDebugComponent } from '../../../shared/components/elements/form-value-debug/form-value-debug.component';

@Component({
    selector: 'app-new-modpack-release-modal',
    templateUrl: './new-modpack-release-modal.component.html',
    styleUrls: ['./new-modpack-release-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, MatRadioGroup, MatRadioButton, NgClass, MatDialogActions, ButtonComponent, ReactiveFormValueDebugComponent]
})
export class NewModpackReleaseModalComponent {
    private formBuilder = inject(FormBuilder);
    private modpackReleaseService = inject(ModpackReleaseService);
    dialogRef = inject<MatDialogRef<NewModpackReleaseModalComponent>>(MatDialogRef);
    data = inject<{
        previousRelease: ModpackRelease;
    }>(MAT_DIALOG_DATA);

    previousVersion: string;
    major: string;
    minor: string;
    patch: string;
    submitting: boolean = false;
    form = this.formBuilder.group({
        version: ['', Validators.required]
    });

    constructor() {
        const data = this.data;

        this.previousVersion = data.previousRelease.version;

        const previousVersionParts: number[] = this.previousVersion.split('.').map((x: string) => parseInt(x, 10));
        this.major = `${previousVersionParts[0] + 1}.0.0`;
        this.minor = `${previousVersionParts[0]}.${previousVersionParts[1] + 1}.0`;
        this.patch = `${previousVersionParts[0]}.${previousVersionParts[1]}.${previousVersionParts[2] + 1}`;

        this.form.controls.version.setValue(this.patch);
    }

    create() {
        this.submitting = true;
        const formValue = this.form.getRawValue();
        this.modpackReleaseService.createNewRelease(formValue.version, () => {
            this.dialogRef.close(true);
        });
    }
}
