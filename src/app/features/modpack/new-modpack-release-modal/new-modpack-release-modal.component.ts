import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { ModpackRelease } from '../models/modpack-release';
import { ModpackReleaseService } from '../modpackRelease.service';

@Component({
    selector: 'app-new-modpack-release-modal',
    templateUrl: './new-modpack-release-modal.component.html',
    styleUrls: ['./new-modpack-release-modal.component.scss']
})
export class NewModpackReleaseModalComponent {
    instantErrorStateMatcher: InstantErrorStateMatcher = new InstantErrorStateMatcher();
    previousVersion: string;
    major: string;
    minor: string;
    patch: string;
    submitting: boolean = false;
    form = this.formBuilder.group({
        version: ['', Validators.required]
    });

    constructor(
        private formBuilder: FormBuilder,
        private modpackReleaseService: ModpackReleaseService,
        public dialogRef: MatDialogRef<NewModpackReleaseModalComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            previousRelease: ModpackRelease;
        }
    ) {
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
