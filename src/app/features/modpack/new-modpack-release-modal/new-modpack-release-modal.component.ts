import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/Services/formhelper.service';
import { ModpackRelease } from '../models/ModpackRelease';
import { ModpackReleaseService } from '../modpackRelease.service';

@Component({
    selector: 'app-new-modpack-release-modal',
    templateUrl: './new-modpack-release-modal.component.html',
    styleUrls: ['./new-modpack-release-modal.component.scss']
})
export class NewModpackReleaseModalComponent {
    @Output() successEvent: any = new EventEmitter();
    form: UntypedFormGroup;
    instantErrorStateMatcher: InstantErrorStateMatcher = new InstantErrorStateMatcher();
    previousVersion: string;
    major: string;
    minor: string;
    patch: string;
    submitting: boolean = false;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private modpackReleaseService: ModpackReleaseService,
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

    create() {
        this.submitting = true;
        const formValue: any = this.form.getRawValue();
        this.modpackReleaseService.createNewRelease(formValue.version, () => {
            this.successEvent.emit();
        });
    }
}
