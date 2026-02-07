import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { NewBuild } from '../models/new-build';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';

function onlyOne(form: UntypedFormGroup): ValidationErrors | null {
    if (form && form.controls['branch'].value !== '' && form.controls['branch'].value !== 'No branch' && form.controls['commitId'].value !== '') {
        return { both: true };
    }

    return null;
}

@Component({
    selector: 'app-new-modpack-build-modal',
    templateUrl: './new-modpack-build-modal.component.html',
    styleUrls: ['./new-modpack-build-modal.component.scss']
})
export class NewModpackBuildModalComponent {
    form: UntypedFormGroup;
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    validationMessages = {
        commitId: [{ type: 'pattern', message: 'Commit ID format is invalid' }]
    };
    configurations: string[] = ['Development', 'Release'];
    branches: string[] = [];
    submitting = false;

    constructor(private formBuilder: UntypedFormBuilder, public dialogRef: MatDialogRef<NewModpackBuildModalComponent>, @Inject(MAT_DIALOG_DATA) public data: { branches: string[] }) {
        this.branches = data.branches;
        this.form = this.formBuilder.group({
            configuration: ['Development', Validators.required],
            referenceGroup: this.formBuilder.group(
                {
                    branch: ['No branch'],
                    commitId: ['', Validators.pattern('^[a-fA-F0-9]{40}$')]
                },
                { validator: onlyOne }
            ),
            ace: [false],
            acre: [false],
            air: [false]
        });
    }

    run() {
        const formValue = this.form.getRawValue();
        const reference = formValue.referenceGroup.branch !== 'No branch' ? formValue.referenceGroup.branch : formValue.referenceGroup.commitId;
        this.dialogRef.close({ reference: reference, ace: formValue.ace, acre: formValue.acre, air: formValue.air, configuration: formValue.configuration.toLowerCase() });
    }
}
