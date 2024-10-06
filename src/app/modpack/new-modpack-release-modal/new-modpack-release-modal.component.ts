import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '../../Services/formhelper.service';
import { ModpackRelease } from '../models/ModpackRelease';

@Component({
    selector: 'app-new-modpack-release-modal',
    templateUrl: './new-modpack-release-modal.component.html',
    styleUrls: ['./new-modpack-release-modal.component.scss']
})
export class NewModpackReleaseModalComponent {
    @Output() completedEvent: any = new EventEmitter<string>();
    form: FormGroup;
    instantErrorStateMatcher: InstantErrorStateMatcher = new InstantErrorStateMatcher();
    previousVersion: string;
    major: string;
    minor: string;
    patch: string;
    submitting: boolean = false;

    constructor(
        private formBuilder: FormBuilder,
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

        this.form = this.formBuilder.group({
            version: [this.patch, Validators.required]
        });
    }

    run() {
        this.submitting = true;
        const formValue = this.form.getRawValue();
        this.dialogRef.close();
        this.completedEvent.emit(formValue.version);
    }
}
